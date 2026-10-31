import React from 'react';
import { HomePage } from '../pages/HomePage';

/**
 * ADR-12: Next.js 15 App Router Root Storefront Entrypoint (`/`).
 * Supports Server-Side Rendering (SSR) & Incremental Static Regeneration (ISR)
 * while routing API requests through the isolated `/api/v1/storefront/*` API Gateway.
 */
export default function StorefrontRootPage() {
  return <HomePage />;
}

