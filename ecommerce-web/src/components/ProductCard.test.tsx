// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProductCard } from './ProductCard';
import type { ProductSummary } from '../types';

const actions = vi.hoisted(() => ({ add: vi.fn(), toggle: vi.fn() }));
vi.mock('../context/CartContext', () => ({ useCart: () => ({ addToCart: actions.add }) }));
vi.mock('../context/WishlistContext', () => ({
  useWishlist: () => ({ isWishlisted: () => false, toggleWishlist: actions.toggle }),
}));

const product: ProductSummary = {
  id: 'product-1', primaryVariantId: 'variant-1', name: 'Produk Rumah Pilihan',
  code: 'PRODUCT-1', description: '', brandName: 'SMS', categoryName: 'Furniture',
  minPrice: 1500000, maxPrice: 1500000, primaryImageUrl: 'https://example.com/product.jpg',
  commercialAvailability: 'IN_STOCK', leadTimeDays: 1, inStockCount: 5,
};

beforeEach(() => { vi.clearAllMocks(); actions.add.mockResolvedValue(undefined); actions.toggle.mockResolvedValue(true); });
afterEach(cleanup);

it('keeps shopping and wishlist actions accessible without nesting buttons in links', async () => {
  render(<MemoryRouter><ProductCard product={product} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah' }));
  await waitFor(() => expect(actions.add).toHaveBeenCalledWith('variant-1', 1, product));
  await screen.findByRole('button', { name: 'Ditambahkan' });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan ke daftar keinginan' }));
  await waitFor(() => expect(actions.toggle).toHaveBeenCalledWith('product-1', undefined, 1500000));
  expect(screen.getByTestId('product-card').querySelector('a button')).toBeNull();
});

it('shows failed cart update instead of pretending item was added', async () => {
  actions.add.mockRejectedValue(new Error('Server unavailable'));
  render(<MemoryRouter><ProductCard product={product} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Produk gagal ditambahkan. Coba lagi.');
  expect(screen.queryByRole('button', { name: 'Ditambahkan' })).toBeNull();
});
