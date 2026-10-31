// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { wishlistShareError, wishlistShareUrl } from './wishlistShare';

afterEach(() => vi.unstubAllEnvs());
it('builds same-origin HTTPS links without forwarding private identity or callback parameters', () => {
  vi.stubEnv('VITE_PUBLIC_STOREFRONT_URL', 'https://shop.example.test');
  expect(wishlistShareUrl('a'.repeat(43))).toBe(`https://shop.example.test/wishlist/share/${'a'.repeat(43)}`);
  expect(() => wishlistShareUrl('../redirect')).toThrow('Invalid wishlist share token');
  for (const origin of ['http://shop.example.test', 'https://user:password@shop.example.test', 'https://shop.example.test/path']) {
    vi.stubEnv('VITE_PUBLIC_STOREFRONT_URL', origin);
    expect(() => wishlistShareUrl('a'.repeat(43))).toThrow('Origin toko publik tidak valid');
  }
});
it('translates known HTTP failure classes while preserving unknown diagnostics', () => {
  expect(wishlistShareError({ isAxiosError: true, response: { status: 404 } })).toContain('kedaluwarsa');
  expect(wishlistShareError({ isAxiosError: true, response: { status: 409 } })).toContain('direservasi');
  expect(wishlistShareError(new Error('Unexpected backend diagnostic'))).toBe('Unexpected backend diagnostic');
});
