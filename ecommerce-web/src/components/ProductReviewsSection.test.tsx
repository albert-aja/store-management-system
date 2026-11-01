// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductReviewsSection } from './ProductReviewsSection';
import { storefrontApi } from '../services/api';

vi.mock('../services/api', () => ({
  storefrontApi: {
    getProductReviews: vi.fn(),
    getReviewEligibility: vi.fn(),
    submitReview: vi.fn(),
  },
}));

describe('ProductReviewsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (storefrontApi.getProductReviews as any).mockResolvedValue({
      averageRating: 4.8,
      totalReviews: 2,
      distribution: { stars5: 1, stars4: 1, stars3: 0, stars2: 0, stars1: 0 },
      reviews: [
        {
          id: 'rev-1',
          customerId: 'cust-1',
          customerName: 'Budi S.',
          rating: 5,
          title: 'Sangat Jernih',
          content: 'Kualitas 4K tajam dan memuaskan.',
          verifiedPurchase: true,
          createdAt: '2026-11-01T10:00:00Z',
        },
        {
          id: 'rev-2',
          customerId: 'cust-2',
          customerName: 'Siti A.',
          rating: 4,
          title: 'Bagus Sekali',
          content: 'Packaging rapi dan aman.',
          verifiedPurchase: true,
          createdAt: '2026-10-30T10:00:00Z',
        },
      ],
    });
    (storefrontApi.getReviewEligibility as any).mockResolvedValue({
      eligible: true,
      alreadyReviewed: false,
      orderNumber: 'SO-TEST-100',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders average rating, distribution bars, and verified review cards', async () => {
    render(<ProductReviewsSection productId="prd-1" productName="Smart TV" />);

    await waitFor(() => {
      expect(screen.getByTestId('average-rating-display').textContent).toBe('4.8');
    });

    expect(screen.getByText('Budi S.')).toBeTruthy();
    expect(screen.getByText('Siti A.')).toBeTruthy();
    expect(screen.getAllByText(/Pembelian Terverifikasi|Verified Purchase/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Sangat Jernih')).toBeTruthy();
  });

  it('filters reviews when clicking star rating filter buttons', async () => {
    render(<ProductReviewsSection productId="prd-1" productName="Smart TV" />);

    await waitFor(() => {
      expect(screen.getByText('Sangat Jernih')).toBeTruthy();
    });

    // Click 4-star filter
    const star4Buttons = screen.getAllByRole('button').filter((b) => b.textContent?.includes('4'));
    fireEvent.click(star4Buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Bagus Sekali')).toBeTruthy();
    });
  });

  it('shows delivery pending gate warning when customer delivery is still in transit', async () => {
    (storefrontApi.getReviewEligibility as any).mockResolvedValue({
      eligible: false,
      alreadyReviewed: false,
      orderNumber: 'SO-IN-TRANSIT-555',
      reason: 'DELIVERY_PENDING',
    });

    render(<ProductReviewsSection productId="prd-1" productName="Smart TV" />);

    await waitFor(() => {
      expect(screen.getByTestId('write-review-button')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('write-review-button'));

    await waitFor(() => {
      expect(screen.getByText(/Pengiriman Masih Berlangsung|Delivery In Transit/i)).toBeTruthy();
      expect(screen.getByText(/masih dalam proses pengiriman/i)).toBeTruthy();
    });
  });

  it('submits review when customer is verified and eligible', async () => {
    (storefrontApi.submitReview as any).mockResolvedValue({
      id: 'rev-new',
      customerId: 'cust-1',
      customerName: 'Budi S.',
      rating: 5,
      title: 'Mantap Sekali',
      content: 'Barang sangat bagus dan berfungsi maksimal.',
      verifiedPurchase: true,
      createdAt: '2026-11-01T12:00:00Z',
    });

    render(<ProductReviewsSection productId="prd-1" productName="Smart TV" />);

    await waitFor(() => {
      expect(screen.getByTestId('write-review-button')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('write-review-button'));

    await waitFor(() => {
      expect(screen.getByText(/Pembelian Terverifikasi:|Verified Purchase:/i)).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText(/Contoh: Kualitas gambar luar biasa|e\.g\. Outstanding picture quality/i), {
      target: { value: 'Mantap Sekali' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ceritakan pengalaman Anda|Share your experience/i), {
      target: { value: 'Barang sangat bagus dan berfungsi maksimal.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Kirim Ulasan|Submit Review/i }));

    await waitFor(() => {
      expect(storefrontApi.submitReview).toHaveBeenCalledWith({
        productId: 'prd-1',
        rating: 5,
        title: 'Mantap Sekali',
        content: 'Barang sangat bagus dan berfungsi maksimal.',
      });
      expect(screen.getByText(/Ulasan Berhasil Dikirim!|Review Submitted Successfully!/i)).toBeTruthy();
    });
  });
});
