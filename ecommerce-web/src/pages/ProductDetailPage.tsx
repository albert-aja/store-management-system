import { useI18n } from '../i18n';
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Store,
  ChevronRight,
  Plus,
  Minus,
  Share2,
  Heart,
} from "lucide-react";
import { ResponsiveImage } from "../components/ResponsiveImage";
import {
  getOptimizedImageUrl,
  preloadCriticalImage,
} from "../utils/imageOptimizer";
import { storefrontApi } from "../services/api";
import { ProductDetail, Variant } from "../types";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { FlashSaleBadge } from "../components/FlashSaleBadge";

export const ProductDetailPage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);

  const wishlisted = product ? isWishlisted(product.id) : false;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    storefrontApi
      .getProductDetail(id)
      .then((data) => {
        setProduct(data);
        setSelectedImage(data.primaryImageUrl);
        // Backlog [P.22]: Immediately preload product hero asset to minimize LCP
        preloadCriticalImage(data.primaryImageUrl, {
          preset: "hero",
          sizes: "(max-width: 1024px) 100vw, 50vw",
          fetchPriority: "high",
        });
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
    const refresh = window.setInterval(() => {
      storefrontApi
        .getProductDetail(id)
        .then((data) => {
          setProduct(data);
          setSelectedVariant(
            (current) =>
              data.variants.find((variant) => variant.id === current?.id) ??
              data.variants[0] ??
              null,
          );
        })
        .catch(console.error);
    }, 15000);
    return () => window.clearInterval(refresh);
  }, [id]);

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-1/3 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-6 bg-slate-200 rounded w-1/2" />
              <div className="h-24 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">
          {t("Produk Tidak Ditemukan")}</h2>
        <Link
          to="/products"
          className="text-xs font-semibold text-sky-600 hover:underline"
        >
          {t("Kembali ke Katalog Produk")}</Link>
      </div>
    );
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const currentPrice = selectedVariant
    ? selectedVariant.price
    : product.minPrice;
  const isVariantReady = selectedVariant
    ? selectedVariant.commercialAvailability === "IN_STOCK"
    : product.commercialAvailability === "IN_STOCK";
  const leadTime = selectedVariant
    ? selectedVariant.leadTimeDays
    : product.leadTimeDays;

  const handleAddToCart = async () => {
    const vId = selectedVariant ? selectedVariant.id : product.id + "-v1";
    await addToCart(vId, quantity, product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = async () => {
    const vId = selectedVariant ? selectedVariant.id : product.id + "-v1";
    await addToCart(vId, quantity, product);
    navigate("/checkout");
  };

  return (
    <div className="container-custom py-6 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-slate-600">
          {t("Home")}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-slate-600">
          {t("Katalog")}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-white border border-slate-200 card-shadow">
            <ResponsiveImage
              src={selectedImage || product.primaryImageUrl}
              alt={product.name}
              preset="hero"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={true}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.imageUrls.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImage === img
                      ? "border-sky-600 ring-2 ring-sky-600/20"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={getOptimizedImageUrl(img, "thumbnail")}
                    alt={t("Thumb")}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold text-sky-600 uppercase tracking-wider">
                {product.brandName}
              </span>
              <span>SKU: {selectedVariant?.sku || product.code}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              {isVariantReady ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full badge-in-stock">
                  <CheckCircle2 className="w-4 h-4" /> {" " + t("Ready Stock di Showroom & Gudang")}</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full badge-indent">
                  <Clock className="w-4 h-4" /> {" " + t("Indent Distributor (")}{leadTime}{" "}
                  {t("Hari Kerja)")}</span>
              )}
            </div>
          </div>

          {/* Price Box */}
          {(() => {
            const hasDisc = selectedVariant
              ? selectedVariant.hasDiscount
              : product.hasDiscount;
            const origPrice = selectedVariant
              ? selectedVariant.originalPrice || currentPrice
              : product.originalMinPrice || currentPrice;
            const discPct = selectedVariant
              ? selectedVariant.discountPercent
              : product.maxDiscountPercent;
            const discLabel = selectedVariant
              ? selectedVariant.discountLabel
              : product.discountLabel;
            const savings = origPrice - currentPrice;

            return (
              <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {t("Harga Resmi Toko")}</span>
                  {hasDisc && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">
                      {t("PROMO -")}{discPct}%
                    </span>
                  )}
                </div>

                {hasDisc && origPrice > currentPrice && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-400 line-through">
                      {formatRupiah(origPrice)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {t("Hemat") + " "}{formatRupiah(savings)}
                    </span>
                  </div>
                )}

                <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {formatRupiah(currentPrice)}
                </div>

                {discLabel && (
                  <div className="text-xs text-rose-700 font-medium mt-1">
                    🏷️ {discLabel}
                  </div>
                )}

                <p className="text-[11px] text-slate-500 mt-1">
                  {t("Sudah termasuk PPN 11%. Tersedia opsi cicilan in-house toko atau Kredivo / Akulaku di checkout.")}</p>
              </div>
            );
          })()}

          {(selectedVariant?.flashSale ||
            (!selectedVariant && product.flashSale)) && (
            <FlashSaleBadge
              endsAt={
                selectedVariant?.flashSaleEndsAt ?? product.flashSaleEndsAt
              }
              stockCount={
                selectedVariant?.stockCount ?? product.totalStockCount
              }
            />
          )}

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block">
                {t("Pilih Varian Produk:")}</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                      selectedVariant?.id === v.id
                        ? "border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-600/10"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div>{v.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {formatRupiah(v.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Buy Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">{t("Jumlah:")}</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-slate-100 text-slate-600"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-slate-100 text-slate-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 border shadow-sm ${
                  isAdded
                    ? "bg-emerald-600 text-white border-transparent"
                    : "bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isAdded ? t("Berhasil Ditambahkan!") : t("Tambah ke Keranjang")}
                </span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-sky-600 hover:bg-sky-700 text-white transition flex items-center justify-center gap-2 shadow-md shadow-sky-600/25"
              >
                <Zap className="w-4 h-4" />
                <span>{t("Beli Sekarang")}</span>
              </button>

              <button
                onClick={() =>
                  product &&
                  toggleWishlist(product.id, selectedVariant?.id, currentPrice)
                }
                title={
                  wishlisted ? t("Hapus dari Wishlist") : t("Simpan ke Wishlist")
                }
                className={`p-3 rounded-xl border font-bold text-sm transition flex items-center justify-center gap-2 ${
                  wishlisted
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-rose-600"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${wishlisted ? "fill-rose-500 text-rose-500" : ""}`}
                />
                <span className="hidden sm:inline">
                  {wishlisted ? t("Tersimpan") : t("Wishlist")}
                </span>
              </button>
            </div>
          </div>

          {/* Value Assurance Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span>{t("Garansi Resmi 1 Tahun")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-500" />
              <span>{t("Kurir Toko & Ambil di Cabang")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 card-shadow space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
            {t("Deskripsi & Spesifikasi Produk")}</h3>
          <p className="text-xs text-slate-600 mt-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        {product.specifications && (
          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <table className="w-full text-xs text-left">
              <tbody>
                {Object.entries(product.specifications).map(
                  ([key, val], idx) => (
                    <tr
                      key={key}
                      className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-600 w-1/3">
                        {key}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800">{val}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
