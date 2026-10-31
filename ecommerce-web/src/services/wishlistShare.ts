import axios from 'axios';

export const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function wishlistShareUrl(token: string): string {
  if (!SHARE_TOKEN_PATTERN.test(token)) throw new Error('Invalid wishlist share token');
  const origin = import.meta.env.VITE_PUBLIC_STOREFRONT_URL || window.location.origin;
  const url = new URL(origin);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
    throw new Error('Origin toko publik tidak valid. Gunakan origin HTTPS.');
  }
  return new URL(`/wishlist/share/${token}`, url).href;
}

export function wishlistShareError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 404) return 'Tautan tidak tersedia, sudah kedaluwarsa, atau dicabut.';
    if (error.response?.status === 409) return 'Hadiah sudah direservasi. Muat ulang daftar.';
    if (error.response?.data?.message) return error.response.data.message;
  }
  return error instanceof Error ? error.message : 'Gagal mengakses daftar bersama. Coba lagi.';
}

export function reservationStorageKey(token: string, itemId: string): string {
  return `sms_gift_reservation:${token}:${itemId}`;
}
