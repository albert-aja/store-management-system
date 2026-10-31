import { useI18n } from '../i18n';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  QrCode,
  Landmark,
  Clock,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { storefrontApi } from '../services/api';
import { OrderDetail, PickupPass } from '../types';
import { PickupPassModal } from '../components/PickupPassModal';

export const OrderSuccessPage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [activePickupPass, setActivePickupPass] = useState<PickupPass | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const handleOpenPickupPass = async (num: string) => {
    setPassLoading(true);
    try {
      const pass = await storefrontApi.getPickupPass(num);
      setActivePickupPass(pass);
    } catch {
      alert(t("Gagal memuat tiket pengambilan showroom"));
    } finally {
      setPassLoading(false);
    }
  };

  useEffect(() => {
    if (!orderNumber) return;
    storefrontApi
      .getOrder(orderNumber)
      .then((data) => setOrder(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyVa = () => {
    const hash = (order?.orderNumber || '12345678').split('').reduce((acc, c) => acc + c.charCodeAt(0), 10000000);
    const va = '8808' + Math.abs(hash);
    navigator.clipboard.writeText(va);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!order) return;
    setSimulating(true);
    try {
      const updated = await storefrontApi.simulatePayment(order.orderId || order.orderNumber);
      setOrder(updated);
    } catch (err) {
      console.error(err);
      alert(t("Gagal mensimulasikan pembayaran"));
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-20 text-center text-xs text-slate-500">
        {t("Memuat rincian konfirmasi pesanan...")}</div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">{t("Pesanan Tidak Ditemukan")}</h2>
        <Link to="/" className="text-xs text-sky-600 hover:underline">
          {t("Kembali ke Beranda")}</Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 max-w-3xl space-y-8">
      {/* Success Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 card-shadow text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {t("Pesanan Berhasil Dibuat")}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {t("Terima Kasih atas Pesanan Anda!")}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t("Nomor Pesanan:")}{' '}
            <span className="font-mono font-bold text-slate-800 text-sm bg-slate-100 px-2.5 py-1 rounded-lg">
              {order.orderNumber}
            </span>
          </p>
        </div>

        {/* Deposit Status Pill */}
        <div className="pt-2">
          {order.depositPaid ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t("Pembayaran / Uang Muka Terverifikasi Lunas")}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{t("Menunggu Pembayaran Uang Muka (DP):") + " "}{formatRupiah(order.requiredDepositAmount || order.totalAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Instructions Box (When Not Paid Yet) */}
      {!order.depositPaid && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 card-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <QrCode className="w-5 h-5 text-sky-600" />
              {t("Instruksi Pembayaran Digital")}</h3>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
              {t("Metode:") + " "}{message(order.paymentMethod)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Dynamic QRIS Mock Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="text-xs font-bold text-slate-700">{t("QRIS Standar Nasional")}</div>
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-sm flex flex-col items-center justify-center relative">
                {/* Visual QR Code Mock */}
                <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-slate-900 rounded-lg">
                  {[...Array(25)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${
                        i % 2 === 0 || i % 7 === 0 ? 'bg-white' : 'bg-slate-900'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-slate-500">
                {t("Scan dengan BCA Mobile, Livin', GoPay, OVO, Dana, atau ShopeePay")}</div>
            </div>

            {/* Right: VA Number & Amount Due */}
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">{t("Nomor Virtual Account BCA / Mandiri:")}</span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 font-mono text-sm font-bold text-slate-800">
                  <span>8808 1234 5678 90</span>
                  <button
                    onClick={handleCopyVa}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-sans"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? t("Tersalin!") : t("Salin")}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">{t("Jumlah Yang Harus Dibayar:")}</span>
                <div className="text-2xl font-extrabold text-sky-700">
                  {formatRupiah(order.requiredDepositAmount || order.totalAmount)}
                </div>
              </div>

              {/* Instant Simulation Action */}
              <div className="pt-2">
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>{simulating ? t("Memverifikasi...") : t("Simulasikan Konfirmasi Pembayaran")}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  {t("Tombol ini mensimulasikan webhook pembayaran dari payment gateway secara langsung.")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fulfillment Groups Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 card-shadow space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            {t("Rincian Alokasi Pengiriman (Fulfillment Groups)")}</h3>
          <span className="text-xs font-semibold text-slate-500">
            {t("Preferensi:") + " "}{message(order.fulfillmentPreference)}
          </span>
        </div>

        <div className="space-y-4">
          {order.fulfillmentGroups && order.fulfillmentGroups.length > 0 ? (
            order.fulfillmentGroups.map((fg) => (
              <div
                key={fg.groupId}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                      #{fg.groupNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {t("Grup Pengiriman") + " "}{fg.groupNumber} ({message(fg.fulfillmentMethod)})
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      fg.status === 'READY_FOR_PACKING' || fg.status === 'READY_FOR_PICKUP'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {t("Status:") + " "}{message(fg.status)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  {fg.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-800">{item.productName}</span>
                        <span className="text-slate-400">({item.quantity} {" " + t("unit)")}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.isProcurementRequired ? t("Pengadaan Distributor") : t("Stok Siap Kirim")}
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
                      <span>{t("Buka Tiket Pengambilan Showroom (QR Pass)")}</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">{t("Fulfillment group sedang diproses sistem...")}</p>
          )}
        </div>

        {/* Action Link to Full Tracker */}
        <div className="pt-4 flex justify-between items-center border-t border-slate-100 text-xs">
          <Link to="/" className="text-slate-500 hover:text-slate-800">
            {t("← Kembali Belanja")}</Link>
          <Link
            to="/track"
            className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>{t("Buka Pelacakan Pesanan Lengkap")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

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
