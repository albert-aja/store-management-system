import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Cart, ProductSummary } from '../types';
import { storefrontApi } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  addToCart: (variantId: string, quantity?: number, fallbackProduct?: Partial<ProductSummary>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const previousCustomerId = useRef<string | null>(null);
  const [cart, setCart] = useState<Cart>({
    cartId: '',
    items: [],
    totalItemCount: 0,
    subtotalAmount: 0,
    estimatedTax: 0,
    totalAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const data = await storefrontApi.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  useEffect(() => {
    if (previousCustomerId.current && !user) void refreshCart();
    previousCustomerId.current = user?.customerId ?? null;
  }, [user]);

  const addToCart = async (variantId: string, quantity = 1, fallbackProduct?: Partial<ProductSummary>) => {
    setIsLoading(true);
    try {
      const updated = await storefrontApi.addToCart(variantId, quantity, fallbackProduct);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const updated = await storefrontApi.updateCartItem(itemId, quantity);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      const updated = await storefrontApi.removeCartItem(itemId);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      await storefrontApi.clearCart();
      setCart({
        cartId: '',
        items: [],
        totalItemCount: 0,
        subtotalAmount: 0,
        estimatedTax: 0,
        totalAmount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
