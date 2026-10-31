import { useI18n } from '../i18n';
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";

export const CartPage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [voucherApplied, setVoucherApplied] = useState("");

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError("");
    if (voucherCode.trim().toUpperCase() === "SMSHEMAT") {
      setDiscountAmount(100000);
      setVoucherApplied("SMSHEMAT");
    } else if (voucherCode.trim().toUpperCase() === "SUPER2026") {
      setDiscountAmount(250000);
      setVoucherApplied("SUPER2026");
    } else {
      setVoucherError("Kode voucher tidak valid atau telah kedaluwarsa");
    }
  };

  const finalTotal = Math.max(0, cart.totalAmount - discountAmount);

  if (cart.items.length === 0) {
    return (
      <div className="container-custom py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {t("Keranjang Belanja Anda Kosong")}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {t("Temukan berbagai pilihan elektronik rumah tangga dan furniture resmi berkualitas terbaik.")}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-3 rounded-full transition shadow-md shadow-sky-600/20"
        >
          <span>{t("Mulai Belanja Sekarang")}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t("Keranjang Belanja (")}{cart.totalItemCount} {" " + t("Barang)")}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t("Periksa kembali pilihan produk Anda sebelum melanjutkan ke pemilihan pengiriman & pembayaran.")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700">
                {t("Daftar Produk")}</span>
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                {t("Kosongkan Keranjang")}</button>
            </div>

            <div className="divide-y divide-slate-100">
              {cart.items.map((item) => {
                const isReady = item.commercialAvailability === "IN_STOCK";
                return (
                  <div
                    key={item.itemId}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                  >
                    <img
                      src={getOptimizedImageUrl(item.imageUrl, "thumbnail")}
                      alt={item.productName}
                      className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                      loading="lazy"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full badge-in-stock">
                            <CheckCircle2 className="w-3 h-3" /> {" " + t("Ready Stock")}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full badge-indent">
                            <Clock className="w-3 h-3" /> {" " + t("Indent (Pengadaan)")}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          SKU: {item.sku}
                        </span>
                      </div>

                      <h3
                        className="text-sm font-bold text-slate-800 line-clamp-1"
                        title={item.productName}
                      >
                        {item.productName}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {item.variantName}
                      </p>

                      <div className="text-xs font-semibold text-sky-700">
                        {formatRupiah(item.unitPrice)}
                      </div>
                    </div>

                    {/* Quantity Controls & Subtotal */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          onClick={() =>
                            updateQuantity(item.itemId, item.quantity - 1)
                          }
                          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-l-xl"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.itemId, item.quantity + 1)
                          }
                          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-r-xl"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block sm:hidden">
                            {t("Total:")}</span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </div>

                        <button
                          onClick={() => removeItem(item.itemId)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          title={t("Hapus barang")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Summary Box */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 card-shadow space-y-5">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              {t("Ringkasan Belanja")}</h3>

            {/* Voucher input */}
            <form onSubmit={handleApplyVoucher} className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 block">
                {t("Punya Kode Promo / Voucher?")}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t("Misal: SMSHEMAT")}
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono"
                  />
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                >
                  {t("Gunakan")}</button>
              </div>
              {voucherApplied && (
                <p className="text-[10px] text-emerald-600 font-semibold">
                  {t("Voucher") + " "}{voucherApplied} {" " + t("berhasil digunakan (-")}{formatRupiah(discountAmount)})!
                </p>
              )}
              {voucherError && (
                <p className="text-[10px] text-red-500">{voucherError}</p>
              )}
            </form>

            {/* Subtotals */}
            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>{t("Total Harga (")}{cart.totalItemCount} {" " + t("barang)")}</span>
                <span className="font-medium text-slate-800">
                  {formatRupiah(cart.subtotalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("PPN 11% (Termasuk)")}</span>
                <span className="font-medium text-slate-800">
                  {formatRupiah(cart.estimatedTax)}
                </span>
              </div>
              {(cart.totalDiscountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>{t("Diskon produk")}</span>
                  <span>
                    -
                    {formatRupiah(
                      (cart.totalDiscountAmount ?? 0) -
                        (cart.orderDiscountAmount ?? 0),
                    )}
                  </span>
                </div>
              )}
              {(cart.orderDiscountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-rose-700 font-medium">
                  <span>
                    {cart.orderDiscountLabel || t("Diskon volume / bundel")}
                  </span>
                  <span>-{formatRupiah(cart.orderDiscountAmount ?? 0)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>{t("Potongan Promo Voucher")}</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                <span>{t("Total Tagihan")}</span>
                <span className="text-sky-700">{formatRupiah(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 text-sm"
            >
              <span>{t("Lanjut ke Pembayaran")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{t("Transaksi Terproteksi & 100% Aman")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
