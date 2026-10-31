import { LanguageSwitcher, useI18n } from '../i18n';
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Package, User, Store, ChevronDown, Heart, Home, LayoutGrid } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../services/auth';

interface NavbarProps {
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { t, message, locale } = useI18n();
  const { cart } = useCart();
  const { totalItems } = useWishlist();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchTerm.trim()) navigate(`/products?query=${encodeURIComponent(searchTerm.trim())}`);
  };

  const navigation = [
    { to: '/', label: t("Beranda"), icon: Home, end: true },
    { to: '/products', label: t("Katalog"), icon: LayoutGrid, end: false },
    { to: '/cart', label: t("Keranjang"), icon: ShoppingCart, end: false },
    { to: '/track', label: t("Lacak"), icon: Package, end: false },
    { to: '/account', label: t("Akun"), icon: User, end: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        {logoutError && <p role="alert" className="px-4 py-2 text-sm text-red-600">{message(logoutError)}</p>}
        <div className="container-custom flex h-20 items-center justify-between gap-2 md:gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={t("SMS Mart beranda")}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
              <Store className="h-5 w-5" />
            </span>
            <span className="hidden min-[400px]:block">
              <span className="block text-base font-semibold tracking-tight sm:text-lg">SMS Mart</span>
              <span className="hidden text-xs text-slate-500 sm:block">{t('Retail & Living')}</span>
            </span>
          </Link>
          <form onSubmit={handleSearch} className="relative hidden max-w-md flex-1 md:block" role="search">
            <input aria-label={t("Cari produk")} type="search" placeholder={t("Cari elektronik & furniture")}
              value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="field pl-11" />
            <button type="submit" aria-label={t("Cari")} className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center text-slate-400">
              <Search className="h-5 w-5" />
            </button>
          </form>
          <nav aria-label={t("Menu utama")} className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <NavLink to="/products" className={({ isActive }) =>
              `hidden rounded-lg px-3 py-2 text-sm font-medium lg:block ${isActive ? 'text-sky-700' : 'text-slate-600 hover:text-slate-900'}`}>
              {t("Katalog")}</NavLink>
            <Link to="/track" aria-label={t("Lacak pesanan")} className="hidden rounded-xl p-3 text-slate-500 hover:bg-slate-50 md:block">
              <Package className="h-5 w-5" />
            </Link>
            <Link to="/wishlist" aria-label={totalItems ? t('Wishlist, {count} produk', { count: totalItems }) : t('Wishlist')}
              className="relative rounded-xl p-3 text-slate-500 hover:bg-slate-50">
              <Heart className="h-5 w-5" />
              {totalItems > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-sky-600" />}
            </Link>
            <button onClick={onOpenCart ?? (() => navigate('/cart'))} aria-label={t('Keranjang Belanja, {count} barang', { count: cart.totalItemCount })}
              className="relative rounded-xl p-3 text-slate-500 hover:bg-slate-50">
              <ShoppingCart className="h-5 w-5" />
              {cart.totalItemCount > 0 && <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-semibold text-white">{cart.totalItemCount}</span>}
            </button>
            <div className="relative">
              {user ? <>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} aria-expanded={isUserMenuOpen} aria-label={t("Menu akun")}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-700">{user.fullName.charAt(0).toUpperCase()}</span>
                  <span className="hidden max-w-24 truncate sm:block">{user.fullName.split(' ')[0]}</span>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
                </button>
                {isUserMenuOpen && <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs text-slate-500">{t("Masuk sebagai")}</p>
                    <p className="truncate text-sm font-medium">{user.email}</p>
                  </div>
                  <Link to="/track" onClick={() => setIsUserMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm hover:bg-slate-50">{t("Pesanan Saya")}</Link>
                  <button className="w-full rounded-lg px-3 py-3 text-left text-sm text-red-600 hover:bg-red-50" onClick={async () => {
                    setLogoutError(null);
                    try { await logout(); setIsUserMenuOpen(false); }
                    catch (error) { setLogoutError(authErrorMessage(error)); }
                  }}>{t("Keluar")}</button>
                </div>}
              </> : <Link to="/auth" aria-label={t("Masuk")} className="hidden md:inline-flex button-primary">{t("Masuk")}</Link>}
            </div>
          </nav>
        </div>
      </header>
      <nav aria-label={t("Navigasi mobile")} className="mobile-navigation">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) =>
            `flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium ${isActive ? 'text-sky-700' : 'text-slate-500'}`}>
            {({ isActive }) => <>
              <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? 'bg-sky-50' : ''}`}><Icon className="h-5 w-5" /></span>
              {label}
            </>}
          </NavLink>
        ))}
      </nav>
    </>
  );
};
