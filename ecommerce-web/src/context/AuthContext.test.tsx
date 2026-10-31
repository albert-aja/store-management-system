// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthPage } from '../pages/AuthPage';

const mocks = vi.hoisted(() => ({
  listener: undefined as ((event: AuthChangeEvent, session: Session | null) => void) | undefined,
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
  loadProfile: vi.fn(),
  setToken: vi.fn(),
}));

vi.mock('../services/auth', () => ({
  getAuthClient: () => ({
    auth: {
      onAuthStateChange: (listener: typeof mocks.listener) => {
        mocks.listener = listener;
        listener?.('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
      },
      signInWithOtp: mocks.signInWithOtp,
      verifyOtp: mocks.verifyOtp,
      signInWithOAuth: mocks.signInWithOAuth,
      signOut: mocks.signOut,
    },
  }),
  authErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Login gagal.',
}));
vi.mock('../services/api', () => ({
  loadCustomerProfile: mocks.loadProfile,
  setStorefrontAccessToken: mocks.setToken,
}));

const session = { access_token: 'real-supabase-token', user: { id: 'supabase-user' } } as Session;
const profile = { customerId: 'db-uuid', email: 'customer@example.com', fullName: 'Customer', phone: null };

function Status() {
  const auth = useAuth();
  return <>
    <p data-testid="identity">{auth.user?.customerId ?? 'guest'}</p>
    <p data-testid="error">{auth.error}</p>
    <button onClick={() => void auth.logout()}>Logout</button>
  </>;
}

function renderAuth() {
  return render(<AuthProvider><MemoryRouter><AuthPage /><Status /></MemoryRouter></AuthProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.signInWithOtp.mockResolvedValue({ error: null });
  mocks.verifyOtp.mockResolvedValue({ error: null });
  mocks.signInWithOAuth.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.loadProfile.mockResolvedValue(profile);
});
afterEach(cleanup);

describe('storefront authentication', () => {
  it('ignores forged local identity and does not authenticate after merely sending OTP', async () => {
    localStorage.setItem('sms_storefront_user', JSON.stringify({ customerId: 'forged' }));
    renderAuth();
    fireEvent.change(screen.getByLabelText('Alamat Email'), { target: { value: 'customer@example.com' } });
    fireEvent.click(screen.getByText('Kirim Kode OTP'));
    await screen.findByText(/Kode dikirim ke/);
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'customer@example.com', options: { shouldCreateUser: true },
    });
    expect(screen.getByTestId('identity').textContent).toBe('guest');
    expect(localStorage.getItem('sms_storefront_user')).toBeNull();
    expect(mocks.loadProfile).not.toHaveBeenCalled();
  });

  it('verifies email code then uses backend profile and real Bearer token', async () => {
    renderAuth();
    fireEvent.change(screen.getByLabelText('Alamat Email'), { target: { value: 'customer@example.com' } });
    fireEvent.click(screen.getByText('Kirim Kode OTP'));
    await screen.findByText(/Kode dikirim ke/);
    fireEvent.change(screen.getByLabelText('Kode OTP'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verifikasi & Masuk'));
    await waitFor(() => expect(mocks.verifyOtp).toHaveBeenCalledWith({
      email: 'customer@example.com', token: '123456', type: 'email',
    }));
    await act(async () => mocks.listener?.('SIGNED_IN', session));
    expect(screen.getByTestId('identity').textContent).toBe('db-uuid');
    expect(mocks.loadProfile).toHaveBeenCalledWith('real-supabase-token');
    expect(mocks.setToken).toHaveBeenLastCalledWith('real-supabase-token');
  });

  it('shows wrong/expired code error without signing in', async () => {
    mocks.verifyOtp.mockResolvedValue({ error: new Error('Token has expired or is invalid') });
    renderAuth();
    fireEvent.change(screen.getByLabelText('Alamat Email'), { target: { value: 'customer@example.com' } });
    fireEvent.click(screen.getByText('Kirim Kode OTP'));
    await screen.findByText(/Kode dikirim ke/);
    fireEvent.change(screen.getByLabelText('Kode OTP'), { target: { value: '000000' } });
    fireEvent.click(screen.getByText('Verifikasi & Masuk'));
    expect((await screen.findByRole('alert')).textContent).toBe('Kode sudah kedaluwarsa atau tidak valid');
    expect(screen.getByTestId('identity').textContent).toBe('guest');
  });

  it('starts Google OAuth with storefront callback', async () => {
    renderAuth();
    fireEvent.click(screen.getByText('Lanjutkan dengan Google'));
    await waitFor(() => expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google', options: { redirectTo: `${window.location.origin}/auth` },
    }));
    expect(screen.getByTestId('identity').textContent).toBe('guest');
  });

  it('restores sessions but refuses failed backend profile verification', async () => {
    mocks.loadProfile.mockRejectedValue(new Error('Customer account is inactive'));
    renderAuth();
    await act(async () => mocks.listener?.('INITIAL_SESSION', session));
    expect(screen.getByTestId('identity').textContent).toBe('guest');
    expect(screen.getByTestId('error').textContent).toBe('Customer account is inactive');
    expect(mocks.setToken).toHaveBeenLastCalledWith(null);
  });

  it('clears identity, Bearer token and guest/cart storage on logout', async () => {
    renderAuth();
    await act(async () => mocks.listener?.('SIGNED_IN', session));
    localStorage.setItem('sms_cart_session', 'old-session');
    localStorage.setItem('sms_mock_cart', 'old-cart');
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('guest'));
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mocks.setToken).toHaveBeenLastCalledWith(null);
    expect(localStorage.getItem('sms_cart_session')).toBeNull();
    expect(localStorage.getItem('sms_mock_cart')).toBeNull();
  });

  it('updates refreshed token without dropping verified profile or reloading it', async () => {
    renderAuth();
    await act(async () => mocks.listener?.('SIGNED_IN', session));
    await act(async () => mocks.listener?.('TOKEN_REFRESHED', {
      ...session, access_token: 'refreshed-token',
    }));
    expect(screen.getByTestId('identity').textContent).toBe('db-uuid');
    expect(mocks.loadProfile).toHaveBeenCalledTimes(1);
    expect(mocks.setToken).toHaveBeenLastCalledWith('refreshed-token');
  });

  it('ignores profile response that arrives after sign-out', async () => {
    let resolve: (value: typeof profile) => void = () => {};
    mocks.loadProfile.mockReturnValue(new Promise((done) => { resolve = done; }));
    renderAuth();
    await act(async () => mocks.listener?.('SIGNED_IN', session));
    await act(async () => mocks.listener?.('SIGNED_OUT', null));
    await act(async () => resolve(profile));
    expect(screen.getByTestId('identity').textContent).toBe('guest');
    expect(mocks.setToken).toHaveBeenLastCalledWith(null);
  });
});
