import { useI18n } from '../i18n';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Store, Clock } from 'lucide-react';
import { storefrontApi } from '../services/api';
import { Banner, Category, ProductSummary } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { preloadCriticalImage, preloadCriticalImages } from '../utils/imageOptimizer';

export const HomePage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [b, c, p] = await Promise.all([
          storefrontApi.getBanners(), storefrontApi.getCategories(), storefrontApi.getProducts(),
        ]);
        setBanners(b); setCategories(c); setProducts(p);
        preloadCriticalImages(p.slice(0, 4).map((product) => product.primaryImageUrl),
          { preset: 'card', fetchPriority: 'high' }, 4);
      } catch (err) {
        console.error('Failed to load storefront:', err);
        setError('Halaman gagal dimuat. Silakan muat ulang.');
      } finally { setLoading(false); }
    };
    void fetchData();
    const refresh = window.setInterval(() => {
      storefrontApi.getProducts().then(setProducts).catch(console.error);
    }, 15000);
    return () => window.clearInterval(refresh);
  }, []);

  const banner = banners[activeBanner];
  useEffect(() => {
    if (banner?.imageUrl) preloadCriticalImage(banner.imageUrl, { preset: 'hero', sizes: '(min-width: 768px) 50vw, 100vw', fetchPriority: 'high' });
  }, [banner]);

  return (
    <div className="container-custom space-y-8 py-6 sm:space-y-10 sm:py-8">
      {error && <p role="alert" className="text-sm text-red-600">{message(error)}</p>}
      <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-2" aria-label={t("Pilihan SMS Mart")}>
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">{t('Retail & Living')}</p>
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">{t("Pilihan tepat untuk rumah Anda.")}</h1>
          <p className="max-w-md text-sm leading-6 text-slate-500">{t("Elektronik dan furniture pilihan. Garansi resmi, kirim ke rumah atau ambil di toko.")}</p>
          <Link to="/products" className="button-primary self-start">{t("Jelajahi Katalog") + " "}<ArrowRight className="h-4 w-4" /></Link>
        </div>
        {banner && <div className="relative min-h-48 bg-slate-100 md:min-h-72">
          <ResponsiveImage src={banner.imageUrl} alt={banner.title} preset="hero" priority
            sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/60 bg-white/95 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">{banner.badgeText}</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium">{banner.title}</p>
            <Link to={banner.targetUrl} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">{banner.ctaText} <ArrowRight className="h-3 w-3" /></Link>
            {banners.length > 1 && <div className="mt-3 flex gap-2" aria-label={t("Pilihan promosi")}>
              {banners.map((_, index) => <button key={index} aria-label={t('Slide {number}', { number: index + 1 })} aria-pressed={index === activeBanner}
                onClick={() => setActiveBanner(index)} className="flex h-6 w-8 items-center justify-center">
                <span className={`h-1.5 rounded-full ${index === activeBanner ? 'w-6 bg-sky-600' : 'w-2 bg-slate-300'}`} />
              </button>)}
            </div>}
          </div>
        </div>}
      </section>
      <section className="grid grid-cols-3 gap-2 sm:gap-4" aria-label={t("Layanan toko")}>
        {[{ icon: ShieldCheck, label: t("Garansi resmi") }, { icon: Truck, label: t("Kirim ke rumah") }, { icon: Store, label: t("Ambil di toko") }].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center text-[11px] font-medium sm:flex-row sm:justify-center sm:text-sm">
            <Icon className="h-5 w-5 shrink-0 text-sky-600" /> {label}
          </div>
        ))}
      </section>
      <section className="space-y-4">
        <h2 className="section-title">{t("Kategori pilihan")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((category) => <Link key={category.id} to={`/products?category=${encodeURIComponent(category.name)}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-sky-200">
            <img src={category.imageUrl} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 object-cover" />
            <span className="min-w-0 text-xs font-medium sm:text-sm">{category.name}</span>
          </Link>)}
        </div>
      </section>
      {products.some((product) => product.flashSale) && <section className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="section-title">{t("Flash Sale")}</h2><Link to="/products" className="text-sm font-medium text-sky-700">{t("Lihat semua")}</Link></div>
        <div className="product-grid">{products.filter((product) => product.flashSale).slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3"><h2 className="section-title">{t("Pilihan untuk Anda")}</h2><Link to="/products" className="shrink-0 text-sm font-medium text-sky-700">{t("Lihat semua")}</Link></div>
        <div className="product-grid">
          {loading ? Array.from({ length: 4 }, (_, index) => <div key={index} aria-label={t("Memuat produk")} className="h-80 animate-pulse rounded-2xl bg-slate-200" />)
            : products.slice(0, 8).map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}
        </div>
      </section>
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-3">
          <Clock className="mt-1 h-5 w-5 shrink-0 text-sky-600" />
          <div><h2 className="font-semibold">{t("Lebih banyak pilihan, dengan indent.")}</h2><p className="mt-1 text-sm text-slate-500">{t("Pesan koleksi dari distributor dengan uang muka transparan.")}</p></div>
        </div>
        <Link to="/products?availability=AVAILABLE_PROCUREMENT_REQUIRED" className="button-secondary shrink-0">{t("Lihat koleksi") + " "}<ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  );
};
