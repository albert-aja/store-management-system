// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SharedWishlistView } from './SharedWishlistPage';
import { reservationStorageKey } from '../services/wishlistShare';
import { I18nProvider, LANGUAGE_STORAGE_KEY } from '../i18n';

const mocks = vi.hoisted(() => ({ get: vi.fn(), reserve: vi.fn(), cancel: vi.fn() }));
vi.mock('../services/api', () => ({ wishlistShareApi: mocks }));
const token = 'a'.repeat(43);
const snapshot = {
  createdAt: '2026-11-01T00:00:00Z', expiresAt: '2026-12-01T00:00:00Z',
  items: [{ id: 'item-1', productId: 'product-1', variantId: null, productName: 'Sofa pilihan',
    variantName: 'Blue', primaryImageUrl: 'https://example.test/sofa.jpg', quantity: 1, reserved: false }],
};
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  mocks.get.mockResolvedValue(snapshot);
  mocks.reserve.mockResolvedValue({ cancellationKey: 'b'.repeat(43) });
  mocks.cancel.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function open(value = token) { return render(<I18nProvider><MemoryRouter><SharedWishlistView token={value} /></MemoryRouter></I18nProvider>); }

it('public view needs no account and stores private cancellation capability outside shared URL', async () => {
  mocks.get.mockResolvedValueOnce(snapshot).mockResolvedValueOnce({
    ...snapshot, items: [{ ...snapshot.items[0], reserved: true }],
  }).mockResolvedValue(snapshot);
  open();
  await screen.findByText('Sofa pilihan');
  expect(screen.getByRole('link', { name: /Sofa pilihan/ }).getAttribute('href')).toBe('/products/product-1');
  fireEvent.click(screen.getByRole('button', { name: 'Reservasi hadiah' }));
  await waitFor(() => expect(localStorage.getItem(reservationStorageKey(token, 'item-1'))).toBe('b'.repeat(43)));
  await screen.findByText('Sudah direservasi');
  expect(mocks.reserve).toHaveBeenCalledWith(token, 'item-1');
  fireEvent.click(screen.getByText('Batalkan dengan kunci pribadi'));
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan reservasi' }));
  await screen.findByText('Tersedia untuk hadiah');
  expect(mocks.cancel).toHaveBeenCalledWith(token, 'item-1', 'b'.repeat(43));
  expect(localStorage.getItem(reservationStorageKey(token, 'item-1'))).toBeNull();
});

it('invalid and expired links have explicit failures without sample data', async () => {
  open('invalid');
  expect(screen.getByRole('alert').textContent).toContain('kedaluwarsa');
  expect(mocks.get).not.toHaveBeenCalled();
  cleanup();
  mocks.get.mockRejectedValue(new Error('Snapshot expired'));
  open();
  expect((await screen.findByRole('alert')).textContent).toBe('Snapshot expired');
  expect(screen.queryByText('Sofa pilihan')).toBeNull();
});

it('keeps recovery key visible when storage fails after a successful reservation', async () => {
  mocks.get.mockResolvedValueOnce(snapshot).mockResolvedValue({
    ...snapshot, items: [{ ...snapshot.items[0], reserved: true }],
  });
  open();
  await screen.findByText('Sofa pilihan');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fireEvent.click(screen.getByRole('button', { name: 'Reservasi hadiah' }));
  expect((await screen.findByRole('alert')).textContent).toContain('kunci tidak tersimpan');
  expect(await screen.findByText(`Kunci pemulihan: ${'b'.repeat(43)}`)).toBeTruthy();
});

it('shows claim conflict, permits private-key recovery, and switches to English', async () => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  mocks.reserve.mockRejectedValue(new Error('Already claimed'));
  open();
  await screen.findByText('Sofa pilihan');
  expect(screen.getByText(/gift intent only/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reserve gift' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Already claimed');
  expect(screen.queryByText('Reserved')).toBeNull();
});

it('preserves the private key when navigation happens during a claim', async () => {
  let resolve: (data: { cancellationKey: string }) => void;
  mocks.reserve.mockReturnValue(new Promise((done) => { resolve = done; }));
  const view = open();
  await screen.findByText('Sofa pilihan');
  fireEvent.click(screen.getByRole('button', { name: 'Reservasi hadiah' }));
  view.unmount();
  await act(async () => { resolve({ cancellationKey: 'c'.repeat(43) }); });
  expect(localStorage.getItem(reservationStorageKey(token, 'item-1'))).toBe('c'.repeat(43));
});

it('hides snapshots already at their exact expiry boundary', async () => {
  mocks.get.mockResolvedValue({ ...snapshot, expiresAt: new Date().toISOString() });
  open();
  expect((await screen.findByRole('alert')).textContent).toContain('kedaluwarsa');
  expect(screen.queryByText('Sofa pilihan')).toBeNull();
});
