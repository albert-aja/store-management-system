import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CustomerProfile } from '../types';
import { getAuthClient, authErrorMessage } from '../services/auth';
import { loadCustomerProfile, setStorefrontAccessToken } from '../services/api';

interface AuthContextType {
  user: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearGuestSession() {
  localStorage.removeItem('sms_storefront_user');
  localStorage.removeItem('sms_mock_cart');
  localStorage.removeItem('sms_cart_session');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const activeSubject = useRef<string | null>(null);

  useEffect(() => {
    localStorage.removeItem('sms_storefront_user');
    const params = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const callbackError = params.get('error_description') || fragment.get('error_description');
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const applySession = async (session: Session | null) => {
      const current = ++generation.current;
      if (session && activeSubject.current && activeSubject.current === session.user.id) {
        setStorefrontAccessToken(session.access_token);
        setIsLoading(false);
        return;
      }
      activeSubject.current = null;
      setStorefrontAccessToken(null);
      setUser(null);
      setError(callbackError);
      if (!session) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const profile = await loadCustomerProfile(session.access_token);
        if (active && current === generation.current) {
          setStorefrontAccessToken(session.access_token);
          activeSubject.current = session.user.id;
          setUser(profile);
        }
      } catch (err) {
        if (active && current === generation.current) setError(authErrorMessage(err));
      } finally {
        if (active && current === generation.current) setIsLoading(false);
      }
    };
    try {
      const auth = getAuthClient().auth;
      const { data } = auth.onAuthStateChange((event, session) => {
        if (active && event === 'SIGNED_OUT') clearGuestSession();
        if (active) void applySession(session);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (err) {
      setError(authErrorMessage(err));
      setIsLoading(false);
    }
    return () => {
      active = false;
      generation.current++;
      activeSubject.current = null;
      unsubscribe?.();
      setStorefrontAccessToken(null);
    };
  }, []);

  const sendEmailOtp = async (email: string) => {
    setError(null);
    const { error: authError } = await getAuthClient().auth.signInWithOtp({
      email: email.trim(), options: { shouldCreateUser: true },
    });
    if (authError) throw authError;
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    setError(null);
    const { error: authError } = await getAuthClient().auth.verifyOtp({
      email: email.trim(), token: token.trim(), type: 'email',
    });
    if (authError) throw authError;
  };

  const loginWithGoogle = async () => {
    setError(null);
    const { error: authError } = await getAuthClient().auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (authError) throw authError;
  };

  const logout = async () => {
    const { error: authError } = await getAuthClient().auth.signOut({ scope: 'local' });
    if (authError) {
      setError(authErrorMessage(authError));
      throw authError;
    }
    ++generation.current;
    activeSubject.current = null;
    setStorefrontAccessToken(null);
    setUser(null);
    clearGuestSession();
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, error,
      sendEmailOtp, verifyEmailOtp, loginWithGoogle, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
