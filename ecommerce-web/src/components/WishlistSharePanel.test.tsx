// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { WishlistSharePanel } from './WishlistSharePanel';
import { I18nProvider, LANGUAGE_STORAGE_KEY } from '../i18n';

const mocks = vi.hoisted(() => ({ create: vi.fn(), list: vi.fn(), revoke: vi.fn() }));
vi.mock('../services/api', () => ({ wishlistShareApi: mocks }));
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  mocks.list.mockResolvedValue([]);
  mocks.create.mockResolvedValue({ id: 'share-1', token: 'a'.repeat(43), createdAt: '2026-11-01T00:00:00Z', expiresAt: '2026-12-01T00:00:00Z' });
  mocks.revoke.mockResolvedValue(undefined);
  vi.stubEnv('VITE_PUBLIC_STOREFRONT_URL', 'https://shop.example.test');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });

it('creates a snapshot link, explains guest persistence, copies and revokes', async () => {
  const copy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
  render(<WishlistSharePanel empty={false} guest />);
  expect(screen.getByText(/Hapus cache tamu/)).toBeTruthy();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buat tautan 30 hari' }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Buat tautan 30 hari' }));
  const url = `https://shop.example.test/wishlist/share/${'a'.repeat(43)}`;
  await screen.findByDisplayValue(url);
  fireEvent.click(screen.getByRole('button', { name: 'Salin tautan' }));
  await screen.findByText('Tautan disalin.');
  expect(copy).toHaveBeenCalledWith(url);
  fireEvent.click(screen.getByRole('button', { name: 'Cabut tautan' }));
  await screen.findByText('Tautan dicabut.');
  expect(mocks.revoke).toHaveBeenCalledWith('share-1');
  expect(screen.queryByDisplayValue(url)).toBeNull();
});

it('keeps errors explicit and never creates a fake share', async () => {
  mocks.create.mockRejectedValue(new Error('Service unavailable'));
  render(<WishlistSharePanel empty={false} guest={false} />);
  await waitFor(() => expect(screen.getByRole('button').hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button'));
  expect((await screen.findByRole('alert')).textContent).toBe('Service unavailable');
  expect(screen.queryByLabelText('Tautan publik')).toBeNull();
});

it('disables empty wishlists and localizes English copy', async () => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  render(<I18nProvider><WishlistSharePanel empty guest /></I18nProvider>);
  await waitFor(() => expect(mocks.list).toHaveBeenCalled());
  expect(screen.getByRole('button', { name: 'Create 30-day link' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByText(/Private wishlist changes/)).toBeTruthy();
});
