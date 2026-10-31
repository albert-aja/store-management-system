'use client';

import React from 'react';
import { App } from '../App';

/**
 * ADR-12 Next.js Client Boundary Shell.
 * Hydrates the React 19 Storefront providers (Auth, Cart, Wishlist, and API Gateway interceptors).
 */
export const StorefrontClientShell: React.FC<{ children?: React.ReactNode }> = () => {
  return <App />;
};

