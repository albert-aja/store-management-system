import type { NextConfig } from 'next';

/**
 * ADR-12: E-commerce Storefront Technology Stack & API Gateway Pattern
 * Next.js 15 Configuration with Edge API Gateway Rewrites to Authoritative Spring Boot Backend.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/v1/storefront/:path*',
        destination: `${backendUrl}/api/v1/storefront/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Storefront-Framework',
            value: 'Next.js 15 (React 19)',
          },
          {
            key: 'X-Storefront-Gateway-Pattern',
            value: 'ADR-12 Isolated Storefront Gateway (/api/v1/storefront/*)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

