import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, CheckCircle2, AlertCircle, MessageSquare, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { storefrontApi } from '../services/api';
import { ProductReviewSummary, ReviewEligibility } from '../types';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
}) => {
  const { t } = useI18n();
  const [reviewsData, setReviewsData] = useState<ProductReviewSummary | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadReviewsAndEligibility();
  }, [productId]);

  const loadReviewsAndEligibility = async () => {
    setLoading(true);
    try {
      const [reviews, elig] = await Promise.all([
        storefrontApi.getProductReviews(productId),
        storefrontApi.getReviewEligibility(productId),
      ]);
      setReviewsData(reviews);
      setEligibility(elig);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentInput.trim()) {
      setSubmitError('Ulasan tidak boleh kosong');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await storefrontApi.submitReview({
        productId,
        rating: ratingInput,
        title: titleInput.trim() || undefined,
        content: contentInput.trim(),
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setTitleInput('');
        setContentInput('');
        setRatingInput(5);
        setSubmitSuccess(false);
        loadReviewsAndEligibility();
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !reviewsData) {
    return (
      <div className="py-8 border-t border-slate-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.totalReviews || 0;
  const averageRating = reviewsData?.averageRating || 0;
  const distribution = reviewsData?.distribution || {
    stars5: 0,
    stars4: 0,
    stars3: 0,
    stars2: 0,
    stars1: 0,
  };

  const filteredReviews = selectedFilter === null
    ? reviews
    : reviews.filter((r) => r.rating === selectedFilter);

  return (
    <div className="py-10 border-t border-slate-100" data-testid="product-reviews-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>{t('Ulasan & Penilaian Pelanggan')}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('100% Terverifikasi')}</span>
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('Ulasan asli eksklusif dari pelanggan dengan konfirmasi pengiriman pesanan yang telah selesai.')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          data-testid="write-review-button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('Tulis Ulasan')}</span>
        </button>
      </div>

      {/* Aggregate Rating and Distribution Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/70 mb-8">
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-200">
          <div className="text-5xl font-black text-slate-900 tracking-tight" data-testid="average-rating-display">
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="flex items-center gap-1 text-amber-400 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <div className="text-xs font-medium text-slate-600">
            {totalReviews > 0 ? `${totalReviews} ulasan` : ''}
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col justify-center space-y-2 px-2">
          {[5, 4, 3, 2, 1].map((starLevel) => {
            const count = (distribution as any)[`stars${starLevel}`] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={starLevel} className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedFilter(selectedFilter === starLevel ? null : starLevel)}
                  className={`flex items-center gap-1 w-16 font-semibold hover:text-blue-600 transition-colors ${
                    selectedFilter === starLevel ? 'text-blue-600' : 'text-slate-700'
                  }`}
                >
                  <span>{starLevel} {t('Bintang')}</span>
                </button>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-500 font-mono">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setSelectedFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedFilter === null
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>{t('Semua')} ({totalReviews})</span>
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSelectedFilter(selectedFilter === s ? null : s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              selectedFilter === s
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{s}</span>
            <Star className="w-3 h-3 fill-current" />
            <span>({(distribution as any)[`stars${s}`] || 0})</span>
          </button>
        ))}
      </div>

      {/* Review Cards List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="text-xs text-slate-500">
            {totalReviews === 0
              ? 'Belum ada ulasan'
              : 'Tidak ada ulasan'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
              data-testid="review-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">{rev.customerName}</span>
                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{t('Pembelian Terverifikasi')}</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(rev.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-0.5 text-amber-400 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>

              {rev.title && (
                <h4 className="text-xs font-bold text-slate-800 mb-1">{rev.title}</h4>
              )}

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {rev.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">{t('Tulis Ulasan Pembeli')}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {submitSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{t('Ulasan Berhasil Dikirim!')}</h4>
                  <p className="text-xs text-slate-500">
                    {t('Terima kasih atas ulasan Anda. Ulasan telah diverifikasi dari riwayat pengiriman pesanan Anda.')}
                  </p>
                </div>
              ) : eligibility && !eligibility.eligible ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      {eligibility.reason === 'DELIVERY_PENDING'
                        ? t('Pengiriman Masih Berlangsung')
                        : eligibility.reason === 'AUTH_REQUIRED'
                        ? t('Login Diperlukan')
                        : t('Pembelian Terverifikasi Diperlukan')}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed px-4">
                      {eligibility.reason === 'DELIVERY_PENDING'
                        ? `Pesanan Anda (${eligibility.orderNumber || ''}) masih dalam proses pengiriman. Untuk menjaga integritas mutu produk, ulasan baru dapat diberikan setelah barang tiba dan konfirmasi pengiriman selesai.`
                        : eligibility.reason === 'AUTH_REQUIRED'
                        ? 'Silakan masuk ke akun e-commerce Anda untuk memeriksa kelayakan ulasan pesanan.'
                        : 'Sistem ulasan ini khusus untuk pembeli terverifikasi yang telah menyelesaikan pesanan produk ini.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    {t('Tutup')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {eligibility?.orderNumber && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold">{t('Pembelian Terverifikasi:')} </span>
                        <span>{t('Pesanan')} #{eligibility.orderNumber} {t('telah terkonfirmasi diterima.')}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      {t('Penilaian Produk (1–5 Bintang)')}
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRatingInput(star)}
                          className="p-1 text-amber-400 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= (hoverRating ?? ratingInput)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {hoverRating ?? ratingInput} / 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Judul Ulasan (Opsional)')}
                    </label>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder={t('Contoh: Kualitas gambar luar biasa, pengiriman kilat')}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Isi Ulasan')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contentInput}
                      onChange={(e) => setContentInput(e.target.value)}
                      placeholder={t('Ceritakan pengalaman Anda mengenai kualitas produk, fitur, dan kondisi saat diterima...')}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {t('Batal')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
                    >
                      {submitting ? 'Mengirim...' : t('Kirim Ulasan')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
