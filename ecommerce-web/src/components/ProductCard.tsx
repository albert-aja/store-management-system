import { useI18n } from '../i18n';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check, Clock, CheckCircle2, Heart } from 'lucide-react';
import { ProductSummary } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ResponsiveImage } from './ResponsiveImage';
import { FlashSaleBadge } from './FlashSaleBadge';

interface ProductCardProps {
  product: ProductSummary;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { t, message, locale } = useI18n();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wishlisted = isWishlisted(product.id);
  const isReady = product.commercialAvailability === 'IN_STOCK';
  useEffect(() => () => clearTimeout(timer.current), []);
  const formatPrice = (price: number) => new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      await addToCart(product.primaryVariantId || product.id + '-v1', 1, product);
      setIsAdded(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setIsAdded(false), 1800);
    } catch (err) {
      console.error('Failed to add product to cart:', err);
      setError('Produk gagal ditambahkan. Coba lagi.');
    } finally { setBusy(false); }
  };

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300" data-testid="product-card">
      <div className="relative">
        <Link to={`/products/${product.id}`} className="block aspect-[4/3] overflow-hidden bg-slate-100" aria-label={product.name}>
          <ResponsiveImage src={product.primaryImageUrl} alt={product.name} preset="card" priority={priority}
            className="h-full w-full object-cover" />
        </Link>
        <button type="button" disabled={busy} aria-pressed={wishlisted}
          aria-label={wishlisted ? t("Hapus dari Wishlist") : t("Simpan ke Wishlist")}
          onClick={async () => {
            setBusy(true); setError(null);
            try { await toggleWishlist(product.id, undefined, product.minPrice); }
            catch (err) { console.error('Failed to update wishlist:', err); setError('Wishlist gagal diperbarui. Coba lagi.'); }
            finally { setBusy(false); }
          }}
          className={`absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white ${wishlisted ? 'text-rose-600' : 'text-slate-500 hover:text-sky-700'}`}>
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>
        {product.hasDiscount && <span className="absolute left-2 top-2 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-rose-600">-{product.maxDiscountPercent}%</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <p className="truncate text-xs text-slate-500">{product.brandName} · {product.categoryName}</p>
        <Link to={`/products/${product.id}`} title={product.name} className="line-clamp-2 min-h-10 text-sm font-medium leading-5 hover:text-sky-700">{product.name}</Link>
        <span className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium sm:text-xs ${isReady ? 'badge-in-stock' : 'badge-indent'}`}>
          {isReady ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {isReady ? t("Ready Stock") : t('Indent {days} Hari', { days: product.leadTimeDays })}
        </span>
        {product.flashSale && <FlashSaleBadge endsAt={product.flashSaleEndsAt} stockCount={product.inStockCount} compact />}
        <div className="mt-auto pt-2">
          {product.hasDiscount && product.originalMinPrice && product.originalMinPrice > product.minPrice && (
            <p className="text-xs text-slate-400 line-through">{formatPrice(product.originalMinPrice)}</p>
          )}
          <p className="text-sm font-semibold tracking-tight sm:text-base">{formatPrice(product.minPrice)}</p>
        </div>
        <button type="button" onClick={() => void add()} disabled={busy}
          className="mt-1 flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50 px-2 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100">
          {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {busy ? t("Memproses...") : isAdded ? t("Ditambahkan") : t("Tambah")}
        </button>
        {error && <p role="alert" className="text-xs text-red-600">{message(error)}</p>}
      </div>
    </article>
  );
};
