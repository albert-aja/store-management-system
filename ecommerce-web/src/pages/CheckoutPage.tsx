import { useI18n } from '../i18n';
import { paymentNames } from '../i18n/catalog';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Store,
  CreditCard,
  QrCode,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  AlertCircle,
  FileText,
  Building2,
  Banknote,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { storefrontApi } from '../services/api';
import { PaymentMethod, PickupBranch } from '../types';

export const CheckoutPage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pickupBranches, setPickupBranches] = useState<PickupBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Customer contact info
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '08123456789');

  // Decision B: Fulfillment Method (Home Delivery vs Store Pickup)
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Shipping Address (for DELIVERY)
  const [recipientName, setRecipientName] = useState(user?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '08123456789');
  const [streetAddress, setStreetAddress] = useState('Jl. Jenderal Sudirman No. 42, RT 01/RW 04');
  const [city, setCity] = useState('Jakarta Pusat');
  const [province, setProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState('10210');

  // Decision A: Fulfillment Completeness (Complete vs Partial)
  const [fulfillmentPreference, setFulfillmentPreference] = useState<'COMPLETE' | 'PARTIAL'>('PARTIAL');

  // Payment Selection
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<string>('QRIS');
  const [customerNotes, setCustomerNotes] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [methods, branches] = await Promise.all([
          storefrontApi.getPaymentMethods(),
          storefrontApi.getPickupBranches(),
        ]);
        setPaymentMethods(methods);
        setPickupBranches(branches);
        if (branches.length > 0) {
          setSelectedBranchId(branches[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Check if cart has indent items
  const hasIndentItems = cart.items.some((i) => i.commercialAvailability !== 'IN_STOCK');
  const hasReadyItems = cart.items.some((i) => i.commercialAvailability === 'IN_STOCK');
  const isSplitEligible = hasIndentItems && hasReadyItems;

  // Deposit-First calculation: 30% if indent items exist
  const requiredDeposit = hasIndentItems ? Math.round(cart.totalAmount * 0.3) : cart.totalAmount;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      alert(t("Mohon lengkapi data kontak pelanggan"));
      return;
    }
    if (fulfillmentMethod === 'DELIVERY' && (!streetAddress || !city)) {
      alert(t("Mohon lengkapi alamat pengiriman"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        fulfillmentMethod,
        fulfillmentPreference,
        pickupStoreId: fulfillmentMethod === 'PICKUP' ? selectedBranchId : null,
        paymentMethod: selectedPaymentCode,
        customerNotes,
        orderSource: 'ONLINE_WEB',
        deliveryAddress:
          fulfillmentMethod === 'DELIVERY'
            ? {
                recipientName,
                phone: recipientPhone,
                streetAddress,
                city,
                province,
                postalCode,
              }
            : null,
        items: cart.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      };

      const orderResp = await storefrontApi.checkout(payload);
      navigate(`/order-success/${orderResp.orderNumber}`);
    } catch (err) {
      console.error('Checkout failed', err);
      alert(t("Gagal memproses pesanan. Silakan coba kembali."));
    } finally {
      setSubmitting(false);
    }
  };

  const getMethodIcon = (code: string) => {
    switch (code) {
      case 'QRIS':
        return <QrCode className="w-5 h-5 text-sky-600" />;
      case 'BANK_TRANSFER_VA':
        return <Landmark className="w-5 h-5 text-indigo-600" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'COD_DRIVER':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'CASH_STORE':
        return <Banknote className="w-5 h-5 text-amber-600" />;
      case 'DIRECT_STORE_TRANSFER':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      case 'IN_HOUSE_CREDIT':
        return <FileText className="w-5 h-5 text-rose-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="container-custom py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t("Formulir Pemesanan & Pembayaran")}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t("Konfirmasi alamat pengiriman, preferensi pengiriman dual-axis, dan metode pembayaran resmi.")}</p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Customer Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              {t("Informasi Pelanggan")}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">{t("Nama Lengkap *")}</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t("Misal: Budi Santoso")}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">{t("Email Aktif *")}</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="budi@example.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">{t("Nomor WhatsApp / HP *")}</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Dual-Axis Fulfillment Architecture */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              {t("Pengiriman atau Pengambilan")}</h2>

            {/* Decision B: Fulfillment Method */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-600" />
                <span>{t("Keputusan B: Metode Penyerahan Produk")}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('DELIVERY')}
                  className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                    fulfillmentMethod === 'DELIVERY'
                      ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-sky-600 flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t("Antar Langsung ke Rumah")}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t("Dikirim aman oleh armada kurir internal toko resmi SMS Mart.")}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('PICKUP')}
                  className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                    fulfillmentMethod === 'PICKUP'
                      ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-amber-600 flex-shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t("Ambil Sendiri di Showroom (Pickup)")}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t("Ambil pesanan Anda langsung di cabang showroom toko terdekat.")}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Sub-form based on Decision B */}
            {fulfillmentMethod === 'DELIVERY' ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>{t("Alamat Tujuan Pengiriman")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">{t("Nama Penerima")}</label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">{t("No. HP Penerima")}</label>
                    <input
                      type="tel"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="font-semibold text-slate-600 block mb-1">{t("Alamat Lengkap (Jalan, No Rumah, RT/RW, Patokan)")}</label>
                  <textarea
                    rows={2}
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">{t("Kota / Kab")}</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">{t("Provinsi")}</label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">{t("Kode Pos")}</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Store className="w-4 h-4 text-amber-700" />
                  <span>{t("Pilih Cabang Showroom Pengambilan")}</span>
                </div>

                <div className="space-y-2">
                  {pickupBranches.map((br) => (
                    <label
                      key={br.id}
                      className={`p-3 rounded-lg border block cursor-pointer transition ${
                        selectedBranchId === br.id
                          ? 'border-amber-600 bg-white ring-1 ring-amber-600/20'
                          : 'border-amber-200/60 bg-amber-50/30 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="branch"
                          checked={selectedBranchId === br.id}
                          onChange={() => setSelectedBranchId(br.id)}
                          className="accent-amber-600"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{br.name}</div>
                          <div className="text-[11px] text-slate-500">{br.address}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Decision A: Fulfillment Completeness (Complete vs Partial) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>{t("Keputusan A: Kelengkapan Pengiriman (Customer Decides)")}</span>
                </label>
                {isSplitEligible && (
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {t("Pesanan Campuran (Ready & Indent)")}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentPreference('PARTIAL')}
                  className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                    fulfillmentPreference === 'PARTIAL'
                      ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t("Kirim Bertahap / Parsial (Direkomendasikan)")}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t("Barang yang Ready Stock langsung dikirim/diambil duluan. Barang Indent menyusul saat tiba dari distributor.")}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentPreference('COMPLETE')}
                  className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                    fulfillmentPreference === 'COMPLETE'
                      ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t("Kirim Sekaligus (Complete Fulfillment)")}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t("Tunggu semua produk siap sepenuhnya sebelum diserahkan dalam satu pengiriman utuh.")}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Configurable Payment Methods */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              {t("Pilih Metode Pembayaran Resmi (")}{paymentMethods.length} {" " + t("Opsi Aktif)")}</h2>

            {/* Deposit-First Alert Notice */}
            {hasIndentItems && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{t("Ketentuan Deposit-First Pengadaan:")}</span>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    {t("Keranjang Anda memuat produk Indent dari distributor. Sesuai aturan operasional, Purchase Order ke distributor akan langsung diterbitkan setelah uang muka (DP 30%:") + " "}{formatRupiah(requiredDeposit)}{t(") terverifikasi.")}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {paymentMethods.map((pm) => (
                <label
                  key={pm.code}
                  className={`p-3.5 rounded-xl border block cursor-pointer transition ${
                    selectedPaymentCode === pm.code
                      ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-600/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm.code}
                      checked={selectedPaymentCode === pm.code}
                      onChange={() => setSelectedPaymentCode(pm.code)}
                      className="mt-1 accent-sky-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(pm.code)}
                        <span className="text-xs font-bold text-slate-900">{paymentNames[pm.code] ? t(paymentNames[pm.code]) : pm.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{message(pm.description)}</p>
                      {pm.requiresApproval && (
                        <span className="inline-block mt-1 text-[9px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          {t("Perlu Survei & Verifikasi Limit")}</span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Customer Notes */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("Catatan Tambahan untuk Toko (Opsional)")}</label>
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder={t("Misal: Titip di pos satpam / hubungi sebelum antar")}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow space-y-5 sticky top-24">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              {t("Ringkasan Tagihan Pesanan")}</h3>

            {/* Items Mini List */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {cart.items.map((i) => (
                <div key={i.itemId} className="flex justify-between items-center text-xs">
                  <div className="truncate flex-1 pr-2">
                    <span className="font-semibold text-slate-800">{i.productName}</span>
                    <span className="text-slate-400 block text-[10px]">
                      {i.quantity}x @ {formatRupiah(i.unitPrice)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">{formatRupiah(i.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span>{t("Subtotal Barang")}</span>
                <span className="font-semibold text-slate-800">{formatRupiah(cart.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("PPN 11% (Termasuk)")}</span>
                <span className="font-semibold text-slate-800">{formatRupiah(cart.estimatedTax)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("Biaya Pengiriman (")}{fulfillmentMethod === 'DELIVERY' ? t("Kurir Toko") : t("Pickup")})</span>
                <span className="font-semibold text-emerald-600">{t("Gratis (Promo Showroom)")}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                <span>{t("Total Nilai Pesanan")}</span>
                <span className="text-sky-700">{formatRupiah(cart.totalAmount)}</span>
              </div>

              {hasIndentItems && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 mt-2 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-sky-900">
                    <span>{t("Uang Muka (DP 30%) Wajib:")}</span>
                    <span>{formatRupiah(requiredDeposit)}</span>
                  </div>
                  <p className="text-[10px] text-sky-700">
                    {t("Sisa pembayaran dilunasi saat barang siap dikirim / diambil.")}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-extrabold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 text-sm"
            >
              <span>{submitting ? t("Memproses Pesanan...") : t("Konfirmasi & Buat Pesanan")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[10px] text-slate-400 text-center leading-normal">
              {t("Dengan mengklik tombol di atas, Anda menyetujui Ketentuan Layanan Penjualan Terpadu SMS Mart.")}</div>
          </div>
        </div>
      </form>
    </div>
  );
};
