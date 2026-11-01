// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BundleSimulatorPage } from './BundleSimulatorPage';
import { I18nProvider } from '../i18n';

const mockAddToCart = vi.fn();
vi.mock('../context/CartContext', () => ({
  useCart: () => ({ addToCart: mockAddToCart, cart: {} }),
}));

describe('BundleSimulatorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders bundle simulator with TV and Sofa preset items and shared installment schedule', async () => {
    render(
      <I18nProvider>
        <MemoryRouter>
          <BundleSimulatorPage />
        </MemoryRouter>
      </I18nProvider>
    );

    expect(screen.getByText(/Multi-Product Credit Bundle Simulator/i)).toBeDefined();
    expect(screen.getByText(/Simulasi Kredit Paket Showroom|Integrated Showroom Bundle/i)).toBeDefined();
    expect(screen.getByText('Smart TV 55 Inch UHD 4K')).toBeDefined();
    expect(screen.getByText('Sofa Bed L-Shape Scandinavian Premium')).toBeDefined();
    expect(screen.getByText(/Angsuran Satu Kontrak Terpadu|Single Integrated Contract Installment/i)).toBeDefined();

    // Verify presence of presets
    expect(screen.getByText('Paket Ruang Tamu Modern')).toBeDefined();
    expect(screen.getByText('Paket Kamar Minimalis')).toBeDefined();
    expect(screen.getByText('Paket Dapur & Laundry')).toBeDefined();
  });

  it('allows switching down payment options and tenor', async () => {
    render(
      <I18nProvider>
        <MemoryRouter>
          <BundleSimulatorPage />
        </MemoryRouter>
      </I18nProvider>
    );

    // Click DP 10%
    const dp10Btn = screen.getByRole('button', { name: 'DP 10%' });
    fireEvent.click(dp10Btn);

    // Click 24 tenor button
    const tenor24Btn = screen.getByRole('button', { name: /24/ });
    fireEvent.click(tenor24Btn);

    expect(screen.getByText(/24 bulan|24 months/i)).toBeDefined();
  });
});
