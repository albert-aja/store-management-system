import { useI18n } from '../i18n';
import React, { useState } from 'react';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { storefrontApi } from '../services/api';
import { OrderDetail, PickupPass } from '../types';
import { PickupPassModal } from '../components/PickupPassModal';
import { QrCode } from 'lucide-react';
import { DeliveryReschedulePanel } from '../components/DeliveryReschedulePanel';

export const OrderTrackingPage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const [orderQuery, setOrderQuery] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePickupPass, setActivePickupPass] = useState<PickupPass | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const handleOpenPickupPass = async (orderNum: string) => {
    setPassLoading(true);
    try {
      const pass = await storefrontApi.getPickupPass(orderNum);
      setActivePickupPass(pass);
    } catch {
      alert(t("Gagal memuat tiket pengambilan showroom."));
    } finally {
      setPassLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await storefrontApi.getOrder(orderQuery.trim());
      setOrder(data);
    } catch {
      setError('Nomor pesanan tidak ditemukan. Pastikan format nomor pesanan benar (misal: SO-WEB-...).');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-10 max-w-4xl space-y-8">
      {/* Search Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 card-shadow space-y-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            {t("Layanan Mandiri Pelanggan")}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {t("Lacak Status & Pengiriman Pesanan")}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t("Pantau status verifikasi uang muka, persiapan gudang, pengadaan distributor, dan jadwal pengiriman kurir toko.")}</p>
        </div>

        <form onSubmit={handleSearchOrder} className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t("Masukkan nomor pesanan (Contoh: SO-WEB-1234567)")}
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-sky-600/20"
          >
            {loading ? t("Mencari...") : t("Lacak Sekarang")}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message(error)}</span>
          </div>
        )}
      </div>

      {/* Order Tracking Result View */}
      {order && (
        <div className="space-y-6">
          <DeliveryReschedulePanel orderId={order.orderId} />
          {/* Order Snapshot Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 card-shadow space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">{t("Nomor Pesanan Resmi")}</span>
                <span className="font-mono text-base font-extrabold text-slate-900">{order.orderNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {t("Total:") + " "}{formatRupiah(order.totalAmount)}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    order.depositPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.depositPaid ? t("Uang Muka Terverifikasi") : t("Menunggu DP / Pelunasan")}
                </span>
              </div>
            </div>

            {/* Visual Milestone Timeline */}
            <div className="py-4">
              <h3 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">
                {t("Progres Tahapan Pesanan")}</h3>

              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                {order.timeline && order.timeline.map((event, idx) => (
                  <div key={idx} className="relative pl-6">
                    <span
                      className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        event.completed
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {event.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{message(event.description)}</span>
                        {event.completed && (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {t("Selesai")}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(event.timestamp).toLocaleString(locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fulfillment Groups Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 card-shadow space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                {t("Alokasi Pengiriman Multi-Fulfillment (")}{order.fulfillmentGroups?.length || 1} {" " + t("Bagian)")}</h3>
              <span className="text-xs font-semibold text-slate-500">
                {t("Preferensi:") + " "}{message(order.fulfillmentPreference)}
              </span>
            </div>

            <div className="space-y-4">
              {order.fulfillmentGroups && order.fulfillmentGroups.map((fg) => (
                <div key={fg.groupId} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                        #{fg.groupNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {t("Grup Pengiriman") + " "}{fg.groupNumber} ({fg.fulfillmentMethod === 'DELIVERY' ? t("Kurir Toko") : t("Ambil di Showroom")})
                      </span>
                    </div>
                    <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                      {message(fg.status)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {fg.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-slate-700 py-1">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-slate-400">({item.quantity} {" " + t("unit)")}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.isProcurementRequired ? t("Pengadaan Distributor") : t("Ready Stock")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {fg.fulfillmentMethod === 'PICKUP' && (
                    <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenPickupPass(order.orderNumber)}
                        disabled={passLoading}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>{t("Lihat Tiket & QR Code Pengambilan Showroom")}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pickup Pass Modal */}
      {activePickupPass && (
        <PickupPassModal
          pass={activePickupPass}
          onClose={() => setActivePickupPass(null)}
          onUpdatePass={(updated) => setActivePickupPass(updated)}
        />
      )}
    </div>
  );
};
