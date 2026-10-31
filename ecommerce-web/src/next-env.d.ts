// ADR-12: Next.js & Vite Dual Type Declarations
/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly NEXT_PUBLIC_API_BASE_URL?: string;
    readonly NEXT_PUBLIC_SUPABASE_URL?: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    readonly BACKEND_INTERNAL_URL?: string;
  }
}

declare module 'next' {
  export interface NextConfig {
    reactStrictMode?: boolean;
    output?: 'standalone' | 'export';
    images?: Record<string, any>;
    rewrites?: () => Promise<Array<{ source: string; destination: string }>>;
    headers?: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
  }
}

