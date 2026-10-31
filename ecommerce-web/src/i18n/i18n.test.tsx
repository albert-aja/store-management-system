// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, LANGUAGE_STORAGE_KEY, LanguageSwitcher, formatDateOnly, translate, translateMessage, useI18n } from './index';
import { english, indonesian, type TranslationKey } from './catalog';
import { Navbar } from '../components/Navbar';
import { AuthPage } from '../pages/AuthPage';
import { DeliveryReschedulePanel } from '../components/DeliveryReschedulePanel';

const mocks = vi.hoisted(() => ({
  schedules: vi.fn(),
  request: vi.fn(),
  auth: { user: null, isAuthenticated: false, isLoading: false, error: null,
    loginWithGoogle: vi.fn(), logout: vi.fn(), sendEmailOtp: vi.fn(), verifyEmailOtp: vi.fn() },
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../context/CartContext', () => ({ useCart: () => ({ cart: { totalItemCount: 2 } }) }));
vi.mock('../context/WishlistContext', () => ({ useWishlist: () => ({ totalItems: 1 }) }));
vi.mock('../services/api', () => ({
  storefrontApi: { getDeliverySchedules: mocks.schedules, requestDeliveryReschedule: mocks.request },
}));

function Sample() {
  const { t, locale } = useI18n();
  return <><LanguageSwitcher /><h1>{t('Akun Saya')}</h1>
    <p>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(1500000)}</p></>;
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.auth.user = null;
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Storefront ID/EN', () => {
  it('defaults to Indonesian and persists English across remounts', () => {
    const view = render(<I18nProvider><Sample /></I18nProvider>);
    expect(screen.getByRole('heading').textContent).toBe('Akun Saya');
    expect(document.documentElement.lang).toBe('id');
    fireEvent.change(screen.getByRole('combobox', { name: 'Bahasa' }), { target: { value: 'en' } });
    expect(screen.getByRole('heading').textContent).toBe('My account');
    expect(screen.getByText(/IDR.*1,500,000/)).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    view.unmount();
    render(<I18nProvider><Sample /></I18nProvider>);
    expect(screen.getByRole('heading').textContent).toBe('My account');
  });

  it('switches guest navigation and authentication without clearing entered email', () => {
    render(<I18nProvider><MemoryRouter><Navbar /><AuthPage /></MemoryRouter></I18nProvider>);
    const email = screen.getByLabelText('Alamat Email');
    fireEvent.change(email, { target: { value: 'customer@example.com' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Bahasa' }), { target: { value: 'en' } });
    expect(screen.getByRole('heading', { name: 'Sign in to SMS Mart' })).toBeTruthy();
    expect((screen.getByLabelText('Email address') as HTMLInputElement).value).toBe('customer@example.com');
    expect(screen.getByRole('button', { name: 'Shopping cart, 2 items' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Wishlist, 1 products' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
  });

  it('localizes delivery rules while preserving WIB and API window codes', async () => {
    mocks.auth.user = { customerId: 'customer-1' };
    mocks.schedules.mockResolvedValue([{
      deliveryOrderId: 'do-1', deliveryOrderNumber: 'DO-1', deliveryDate: '2026-11-05',
      deliveryWindow: 'MORNING', plannedDispatchAt: '2026-11-05T02:00:00Z',
      eligible: true, requests: [],
    }]);
    mocks.request.mockResolvedValue({ id: 'r1', status: 'PENDING' });
    render(<I18nProvider><MemoryRouter><LanguageSwitcher /><DeliveryReschedulePanel orderId="order-1" /></MemoryRouter></I18nProvider>);
    await screen.findByText('DO-1');
    fireEvent.change(screen.getByLabelText('Tanggal pengiriman baru'), { target: { value: '2026-11-06' } });
    fireEvent.change(screen.getByLabelText('Waktu pengiriman (WIB)'), { target: { value: 'AFTERNOON' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Bahasa' }), { target: { value: 'en' } });
    expect((screen.getByLabelText('New delivery date') as HTMLInputElement).value).toBe('2026-11-06');
    expect((screen.getByLabelText('Delivery window (WIB)') as HTMLSelectElement).value).toBe('AFTERNOON');
    expect(screen.getByText(/at least 24 hours before planned dispatch/)).toBeTruthy();
    expect(mocks.schedules).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Request rescheduling' }));
    await screen.findByRole('status');
    expect(mocks.request).toHaveBeenCalledWith('do-1', {
      requestedDate: '2026-11-06', requestedWindow: 'AFTERNOON', reason: undefined,
    });
  });

  it('surfaces persistence failures instead of claiming preference was saved', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<I18nProvider><Sample /></I18nProvider>);
    fireEvent.change(screen.getByRole('combobox', { name: 'Bahasa' }), { target: { value: 'en' } });
    expect(screen.getByRole('alert').textContent).toContain('could not be saved');
    expect(screen.getByRole('heading').textContent).toBe('My account');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  it('reports invalid stored languages while retaining the Indonesian default', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'unsupported');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<I18nProvider><Sample /></I18nProvider>);
    expect(screen.getByRole('heading').textContent).toBe('Akun Saya');
    expect(screen.getByRole('alert').textContent).toContain('tidak dapat dimuat');
  });

  it('loads storage errors explicitly and follows changes from another tab', () => {
    render(<I18nProvider><Sample /></I18nProvider>);
    fireEvent(window, new StorageEvent('storage', { key: LANGUAGE_STORAGE_KEY, newValue: 'en' }));
    expect(screen.getByRole('heading').textContent).toBe('My account');
    fireEvent(window, new StorageEvent('storage', { key: LANGUAGE_STORAGE_KEY, newValue: null }));
    expect(screen.getByRole('heading').textContent).toBe('Akun Saya');
    cleanup();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<I18nProvider><Sample /></I18nProvider>);
    expect(screen.getByRole('alert').textContent).toContain('tidak dapat dimuat');
  });

  it('keeps unknown server details and interpolation values intact', () => {
    expect(formatDateOnly('2026-11-05', 'id-ID')).toBe('5 Nov 2026');
    expect(formatDateOnly('2026-11-05', 'en-US')).toBe('Nov 5, 2026');
    expect(() => formatDateOnly('2026-02-30', 'en-US')).toThrow('Invalid delivery date');
    expect(translateMessage('New server diagnostic', 'id')).toBe('New server diagnostic');
    expect(translateMessage('Reschedule requests close 24 hours before planned dispatch', 'id')).toContain('24 jam');
    expect(translate('Sinkron: Akun {name}', 'en', { name: 'Budi Santoso' })).toBe('Sync: Account Budi Santoso');
    for (const key of Object.keys(english) as TranslationKey[]) {
      expect(translate(key, 'en').trim().length).toBeGreaterThan(0);
      expect(translate(key, 'id').trim().length).toBeGreaterThan(0);
      const placeholders = (key.match(/\{\w+\}/g) ?? []).sort();
      expect((english[key].match(/\{\w+\}/g) ?? []).sort()).toEqual(placeholders);
      if (indonesian[key]) expect((indonesian[key].match(/\{\w+\}/g) ?? []).sort()).toEqual(placeholders);
    }
  });
});
