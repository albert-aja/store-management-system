import { useI18n } from '../i18n';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  TrendingDown,
  ShoppingCart,
  Trash2,
  Smartphone,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Tag
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { WishlistSharePanel } from '../components/WishlistSharePanel';

export const WishlistPage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const {
    items,
    totalItems,
    priceDropCount,
    totalPotentialSavings,
    isLoading,
    removeFromWishlist,
    moveToCart,
    simulatePriceDrop,
  } = useWishlist();

  const { isAuthenticated, user } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMoveToCart = async (itemId: string, productName: string) => {
    await moveToCart(itemId);
    showToast(t('"{name}" berhasil dipindahkan ke keranjang!', { name: productName }));
  };

  const handleSimulateDrop = async (itemId: string, name: string) => {
    await simulatePriceDrop(itemId);
    showToast(t('Harga diskon simulasi diterapkan untuk "{name}"!', { name }));
  };

  const formatRp = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString(locale);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2">
            <Link to="/" className="hover:text-blue-600 transition-colors">{t("Beranda")}</Link>
            <span>/</span>
            <span className="text-slate-800">{t("Wishlist & Saved Items")}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                {t("Wishlist & Produk Disimpan")}</h1>
              <p className="text-slate-600 text-sm mt-1">
                {t("Daftar barang impian elektronik & furnitur yang tersimpan dan tersinkronisasi otomatis.")}</p>
            </div>

            {/* Cross-Platform Sync Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-xs text-slate-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-800">
                {isAuthenticated ? t('Sinkron: Akun {name}', { name: user?.fullName ?? '' }) : t("Sinkron: Sesi Browser & Mobile")}
              </span>
            </div>
          </div>
        </div>

        <WishlistSharePanel key={user?.customerId ?? 'guest'} empty={!items.length} guest={!isAuthenticated} />

        {/* Price Drop Hero Banner (P.16 Core Feature) */}
        {priceDropCount > 0 && (
          <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-slate-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-white p-3 text-emerald-700">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("Penurunan Harga Terdeteksi!")}</div>
                  <h2 className="text-lg font-semibold">
                    {t("Ada") + " "}{priceDropCount} {" " + t("produk di wishlist Anda yang sedang turun harga!")}</h2>
                  <p className="mt-1 max-w-xl text-sm text-slate-600">
                    {t("Harga produk ini lebih murah dibandingkan saat pertama kali Anda simpan. Manfaatkan kesempatan sebelum promosi berakhir atau stok habis.")}</p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-white px-5 py-4 md:text-right shrink-0">
                <div className="text-xs font-medium text-slate-500">
                  {t("Total Potensi Hemat")}</div>
                <div className="mt-1 text-xl font-semibold text-emerald-700">
                  {formatRp(totalPotentialSavings)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalItems}</div>
              <div className="text-xs text-slate-500 font-medium">{t("Total Produk Disimpan")}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">{priceDropCount}</div>
              <div className="text-xs text-slate-500 font-medium">{t("Item Turun Harga")}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{t("Sinkronisasi Cloud")}</div>
              <div className="text-xs text-slate-500 font-medium">{t("Tersambung Web & Mobile")}</div>
            </div>
          </div>
        </div>

        {/* Wishlist Items List / Empty State */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
              <Heart className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t("Wishlist Anda Masih Kosong")}</h3>
            <p className="text-sm text-slate-600 mb-6">
              {t("Simpan produk TV, Kulkas, AC, Sofa, dan Furniture favorit Anda dengan menekan ikon hati di halaman katalog untuk memantau penurunan harga otomatis!")}</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              {t("Mulai Jelajahi Katalog")}<ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                  item.hasPriceDrop
                    ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Image Container with Price Drop Badge */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden group">
                    <ResponsiveImage
                      src={item.primaryImageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Price Drop Indicator Tag */}
                    {item.hasPriceDrop && (
                      <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-extrabold tracking-wide flex items-center gap-1.5 shadow-lg animate-pulse">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {t('Hemat').toUpperCase()} {formatRp(item.priceDropAmount)} (-{item.priceDropPercentage}%)
                      </div>
                    )}

                    {/* Stock Status Pill */}
                    <div className="absolute bottom-3 left-3">
                      {item.commercialAvailability === 'IN_STOCK' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50/90 text-emerald-800 backdrop-blur-sm border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {t("Ready Stock Toko")}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50/90 text-amber-800 backdrop-blur-sm border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {t("Indent") + " "}{item.leadTimeDays} {" " + t("Hari")}</span>
                      )}
                    </div>

                    {/* Delete Quick Button */}
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      title={t("Hapus dari Wishlist")}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-500 hover:text-rose-600 rounded-full shadow-md backdrop-blur-sm transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
                      <span>{item.brandName || 'SMS Mart'}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                        {item.categoryName}
                      </span>
                    </div>

                    <Link
                      to={`/products/${item.productId}`}
                      className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2"
                    >
                      {item.productName}
                    </Link>

                    {item.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mb-3">
                        "{item.notes}"
                      </p>
                    )}

                    {/* Price Block */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      {item.hasPriceDrop ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 line-through">
                              {formatRp(item.originalAddedPrice)}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {t("Disimpan:") + " "}{formatRp(item.originalAddedPrice)}
                            </span>
                          </div>
                          <div className="text-xl font-black text-emerald-600">
                            {formatRp(item.currentPrice)}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs text-slate-400">{t("Harga Terkini")}</div>
                          <div className="text-xl font-black text-slate-900">
                            {formatRp(item.currentPrice)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-5 pt-0 flex flex-col gap-2">
                  <button
                    onClick={() => handleMoveToCart(item.id, item.productName)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {t("Pindah ke Keranjang")}</button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleSimulateDrop(item.id, item.productName)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Tag className="w-3 h-3" />
                      {t("Simulasi Turun Harga")}</button>

                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t("Hapus")}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature Explanation & Cross-Device Sync Footer Card */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {t("P.16: Cross-Platform Persistent Wishlist Terpadu")}</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {t("Semua item tersimpan disinkronkan secara real-time ke aplikasi mobile SMS Mart. Notifikasi indikator harga otomatis aktif saat harga barang turun.")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/products"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
            >
              {t("Lanjut Belanja Elektronik & Furnitur")}<ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
