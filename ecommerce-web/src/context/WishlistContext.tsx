import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../i18n';
import { WishlistItem, WishlistSummary } from '../types';
import { storefrontApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

interface WishlistContextType {
  wishlist: WishlistSummary;
  items: WishlistItem[];
  totalItems: number;
  priceDropCount: number;
  totalPotentialSavings: number;
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (
    productId: string,
    variantId?: string,
    currentPrice?: number,
    notes?: string
  ) => Promise<boolean>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  moveToCart: (itemId: string) => Promise<void>;
  simulatePriceDrop: (itemId: string, newPrice?: number) => Promise<void>;
  syncWithAccount: (customerId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { message } = useI18n();
  const { user } = useAuth();
  const { refreshCart } = useCart();

  const [wishlist, setWishlist] = useState<WishlistSummary>({
    items: [],
    totalItems: 0,
    priceDropCount: 0,
    totalPotentialSavings: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refreshWishlist = useCallback(async () => {
    const current = ++requestId.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = await storefrontApi.getWishlist();
      if (current === requestId.current) setWishlist(data);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      if (current === requestId.current) setError('Wishlist gagal dimuat. Silakan coba lagi.');
    } finally {
      if (current === requestId.current) setIsLoading(false);
    }
  }, []);

  // Cross-Platform Synchronize automatically when user signs in
  useEffect(() => {
    const current = ++requestId.current;
    setError(null);
    setWishlist({ items: [], totalItems: 0, priceDropCount: 0, totalPotentialSavings: 0 });
    if (user?.customerId) {
      setIsLoading(true);
      storefrontApi.syncWishlist(user.customerId).then((data) => {
        if (current === requestId.current) setWishlist(data);
      }).catch((err) => {
        console.error('Failed to synchronize wishlist:', err);
        if (current === requestId.current) setError('Sinkronisasi wishlist gagal. Silakan coba lagi.');
      }).finally(() => {
        if (current === requestId.current) setIsLoading(false);
      });
    } else void refreshWishlist();
    return () => { requestId.current++; };
  }, [user, refreshWishlist]);

  const isWishlisted = useCallback(
    (productId: string) => {
      return wishlist.items.some((item) => item.productId === productId);
    },
    [wishlist.items]
  );

  const toggleWishlist = async (
    productId: string,
    variantId?: string,
    currentPrice?: number,
    notes?: string
  ): Promise<boolean> => {
    const existing = wishlist.items.find((i) => i.productId === productId);
    setIsLoading(true);
    try {
      if (existing) {
        await storefrontApi.removeFromWishlist(existing.id);
        await refreshWishlist();
        return false;
      } else {
        await storefrontApi.addToWishlist(productId, variantId, currentPrice, notes);
        await refreshWishlist();
        return true;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    setIsLoading(true);
    try {
      await storefrontApi.removeFromWishlist(itemId);
      await refreshWishlist();
    } finally {
      setIsLoading(false);
    }
  };

  const moveToCart = async (itemId: string) => {
    setIsLoading(true);
    try {
      await storefrontApi.moveToCartFromWishlist(itemId);
      await refreshWishlist();
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePriceDrop = async (itemId: string, newPrice?: number) => {
    setIsLoading(true);
    try {
      await storefrontApi.simulatePriceDrop(itemId, newPrice);
      await refreshWishlist();
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithAccount = async (customerId: string) => {
    setIsLoading(true);
    try {
      const data = await storefrontApi.syncWishlist(customerId);
      setWishlist(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        items: wishlist.items,
        totalItems: wishlist.totalItems,
        priceDropCount: wishlist.priceDropCount,
        totalPotentialSavings: wishlist.totalPotentialSavings,
        isLoading,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        moveToCart,
        simulatePriceDrop,
        syncWithAccount,
        refreshWishlist,
      }}
    >
      {error && <p role="alert" className="text-sm text-red-600 p-3">{message(error)}</p>}
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
};
