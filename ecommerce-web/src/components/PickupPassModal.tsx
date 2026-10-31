import { useI18n } from '../i18n';
import React, { useState } from 'react';
import {
  X,
  Store,
  QrCode,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Copy,
  Check,
  PackageCheck,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PickupPass, HandoverResult } from '../types';
import { storefrontApi } from '../services/api';

interface PickupPassModalProps {
  pass: PickupPass;
  onClose: () => void;
  onUpdatePass: (updated: PickupPass) => void;
}

export const PickupPassModal: React.FC<PickupPassModalProps> = ({ pass, onClose, onUpdatePass }) => {
  const { t, message, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [rackInput, setRackInput] = useState(pass.stagingRackLocation || 'Rak Display B-02 (Showroom Utama)');
  const [stagingLoading, setStagingLoading] = useState(false);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [staffName, setStaffName] = useState('Ahmad (Kasir Showroom)');
  const [handoverResult, setHandoverResult] = useState<HandoverResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pass.pickupPassCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateStaging = async () => {
    setStagingLoading(true);
    setErrorMsg('');
    try {
      const updated = await storefrontApi.stagePickup({
        orderNumber: pass.orderNumber,
        groupNumber: pass.groupNumber,
        stagingRackLocation: rackInput,
        stagedByStaffName: staffName,
      });
      onUpdatePass(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal melakukan staging barang');
    } finally {
      setStagingLoading(false);
    }
  };

  const handleSimulateHandover = async () => {
    setHandoverLoading(true);
    setErrorMsg('');
    try {
      const result = await storefrontApi.verifyHandover({
        pickupPassCode: pass.pickupPassCode,
        staffEmployeeName: staffName,
        recipientIdentityName: pass.recipientName,
        recipientPhone: pass.recipientPhone,
        settleRemainingBalance: true,
      });
      setHandoverResult(result);
      onUpdatePass({
        ...pass,
        stagingStatus: 'COMPLETED',
        handedOverAt: result.handedOverAt,
        handedOverByStaffName: result.staffEmployeeName,
        remainingBalance: 0,
        fullyPaid: true,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memverifikasi serah terima');
    } finally {
      setHandoverLoading(false);
    }
  };

  const isCompleted = pass.stagingStatus === 'COMPLETED';
  const isReady = pass.stagingStatus === 'READY_FOR_PICKUP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto card-shadow border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{t("Tiket Pengambilan Showroom")}</h2>
              <p className="text-[11px] text-slate-500 font-mono">{t("Pesanan #")}{pass.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{message(errorMsg)}</span>
            </div>
          )}

          {/* Staging Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              isCompleted
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : isReady
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {isCompleted ? (
                <ShieldCheck className="w-6 h-6 text-slate-600" />
              ) : isReady ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <Clock className="w-6 h-6 text-amber-600" />
              )}
              <div>
                <div className="text-xs font-bold">
                  {isCompleted
                    ? t("Pesanan Sudah Selesai Diambil")
                    : isReady
                    ? t("Siap Diambil di Showroom")
                    : t("Dalam Penyiapan Staging Toko")}
                </div>
                <div className="text-[11px] opacity-80">
                  {isCompleted
                    ? t('Diserahterimakan oleh {name}', { name: pass.handedOverByStaffName || t("Petugas Toko") })
                    : isReady
                    ? t('Lokasi Rak: {location}', { location: pass.stagingRackLocation })
                    : t("Barang sedang dipersiapkan di rak staging showroom")}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/80 border border-current shadow-xs">
              {pass.stagingStatus}
            </span>
          </div>

          {/* Visual QR Code Box */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-sky-600" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-sky-600" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-sky-600" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-sky-600" />

              {/* Dynamic QR Code Canvas Simulation */}
              <div className="w-44 h-44 bg-slate-900 rounded-xl p-2.5 flex flex-col items-center justify-between text-white">
                <div className="flex justify-between w-full">
                  <div className="w-10 h-10 border-2 border-white rounded-md p-1 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-xs" />
                  </div>
                  <div className="w-10 h-10 border-2 border-white rounded-md p-1 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-xs" />
                  </div>
                </div>
                <div className="w-full text-center py-2 font-mono text-[9px] tracking-widest text-sky-300">
                  {pass.pickupPassCode}
                </div>
                <div className="flex justify-between w-full items-end">
                  <div className="w-10 h-10 border-2 border-white rounded-md p-1 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-xs" />
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono">SMS-MART</div>
                </div>
              </div>
            </div>

            {/* Claim Code Pill with Copy */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {t("Kode Verifikasi Pengambilan")}</span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-extrabold text-slate-900 tracking-wider">
                  {pass.pickupPassCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                  title={t("Salin Kode")}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs">
                {t("Tunjukkan kode QR ini atau sebutkan kode di atas kepada petugas kasir showroom saat pengambilan.")}</p>
            </div>
          </div>

          {/* Showroom Details */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <Store className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">{pass.pickupStoreName}</span>
                <div className="text-[11px] text-slate-500">{pass.pickupStoreAddress}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 pt-1 text-[11px] text-slate-600 border-t border-slate-100">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("Jam Operasional:") + " "}{pass.operatingHours}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("Telepon Cabang:") + " "}{pass.contactPhone}</span>
            </div>
          </div>

          {/* Money Management & Payment Balance */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{t("Total Nilai Pesanan:")}</span>
              <span className="font-bold text-slate-900">{formatRupiah(pass.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("Uang Muka / Terbayar:")}</span>
              <span className="font-bold text-emerald-600">
                {pass.depositPaid ? formatRupiah(pass.requiredDepositAmount) : 'Rp 0'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
              <span>{t("Sisa Tagihan di Showroom:")}</span>
              <span className={`text-sm ${pass.remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pass.remainingBalance > 0 ? formatRupiah(pass.remainingBalance) : t("LUNAS (Tidak ada sisa tagihan)")}
              </span>
            </div>
          </div>

          {/* Staff Staging & Handover Simulation Panel */}
          <div className="p-4 rounded-2xl border border-dashed border-sky-300 bg-sky-50/50 space-y-3">
            <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>{t("Simulasi Operasional Staf Toko & Kasir (Demo)")}</span>
            </div>

            {!isReady && !isCompleted && (
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  {t("Lokasi Rak Staging Showroom:")}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rackInput}
                    onChange={(e) => setRackInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleSimulateStaging}
                    disabled={stagingLoading}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    {stagingLoading ? t("Memproses...") : t("Tandai Siap Ambil")}
                  </button>
                </div>
              </div>
            )}

            {isReady && !isCompleted && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] text-slate-600">
                  {t("Petugas kasir memverifikasi kode") + " "}<span className="font-mono font-bold">{pass.pickupPassCode}</span> {" " + t("dan mencocokkan identitas penerima.")}</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    placeholder={t("Nama Petugas Kasir")}
                  />
                  <button
                    type="button"
                    onClick={handleSimulateHandover}
                    disabled={handoverLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>{handoverLoading ? t("Memverifikasi...") : t("Verifikasi Serah Terima")}</span>
                  </button>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="p-3 bg-emerald-100/70 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {t("Serah terima selesai pada") + " "}{pass.handedOverAt ? new Date(pass.handedOverAt).toLocaleTimeString(locale) : t("Hari ini")}{t('. Barang telah dibawa pelanggan.')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
