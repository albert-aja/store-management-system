import { useI18n } from '../i18n';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { t, message, locale } = useI18n();
  const { cart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-slate-800 text-base">{t("Keranjang Belanja")}</h3>
              <span className="text-xs font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                {cart.totalItemCount}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm">{t("Keranjang belanja Anda masih kosong")}</p>
                <button
                  onClick={onClose}
                  className="text-xs font-semibold text-sky-600 hover:underline"
                >
                  {t("Mulai Belanja Produk")}</button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.itemId}
                  className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition"
                >
                  <img
                    src={getOptimizedImageUrl(item.imageUrl, 'thumbnail')}
                    alt={item.productName}
                    className="w-16 h-16 rounded-lg object-cover bg-white flex-shrink-0 border border-slate-200"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 truncate" title={item.productName}>
                      {item.productName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{item.variantName}</p>
                    <p className="text-xs font-bold text-sky-700 mt-1">
                      {formatRupiah(item.unitPrice)}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title={t("Hapus item")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cart.items.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{t("Subtotal Produk")}</span>
                  <span className="font-medium text-slate-800">{formatRupiah(cart.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("PPN 11% (Resmi)")}</span>
                  <span className="font-medium text-slate-800">{formatRupiah(cart.estimatedTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>{t("Total Tagihan")}</span>
                  <span className="text-sky-700">{formatRupiah(cart.totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 text-sm"
              >
                <span>{t("Lanjut ke Pembayaran")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/cart"
                onClick={onClose}
                className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                {t("Lihat Rincian Lengkap Keranjang")}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

