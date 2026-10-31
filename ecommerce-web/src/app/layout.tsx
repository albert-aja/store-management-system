import React from 'react';
import '../index.css';
import { StorefrontClientShell } from './StorefrontClientShell';

export const metadata = {
  title: 'SMS Mart — Belanja Elektronik & Furniture Resmi (Next.js Storefront)',
  description:
    'Platform belanja online resmi elektronik rumah tangga, Smart TV 4K, dan furniture pilihan dengan Dual-Axis Fulfillment dan 9 metode pembayaran.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="image"
          type="image/webp"
          href="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&h=1000&q=88&fm=webp"
          imageSrcSet="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&h=150&q=80&fm=webp 150w, https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&h=400&q=82&fm=webp 400w, https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&h=1000&q=88&fm=webp 1000w"
          imageSizes="100vw"
          fetchPriority="high"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <StorefrontClientShell>{children}</StorefrontClientShell>
      </body>
    </html>
  );
}

