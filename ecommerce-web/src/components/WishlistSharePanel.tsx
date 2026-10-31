import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { wishlistShareApi } from '../services/api';
import { wishlistShareError, wishlistShareUrl } from '../services/wishlistShare';
import type { WishlistShareSummary } from '../types/wishlistShare';

export function WishlistSharePanel({ empty, guest }: { empty: boolean; guest: boolean }) {
  const { t, message, locale } = useI18n();
  const [shares, setShares] = useState<WishlistShareSummary[]>([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    wishlistShareApi.list().then(
      (data) => { if (active) { setShares(data); setLoading(false); } },
      (error) => { if (active) { setError(wishlistShareError(error)); setLoading(false); } },
    );
    return () => { active = false; };
  }, []);

  const create = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      wishlistShareUrl('a'.repeat(43));
      const receipt = await wishlistShareApi.create();
      setShares((old) => [{ id: receipt.id, createdAt: receipt.createdAt, expiresAt: receipt.expiresAt, revokedAt: null }, ...old]);
      setUrl(wishlistShareUrl(receipt.token));
    } catch (error) { setError(wishlistShareError(error)); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    setError(''); setNotice('');
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Tautan disalin.');
    } catch (error) {
      console.error('Failed to copy wishlist share link:', error);
      setError('Gagal menyalin. Salin tautan secara manual.');
    }
  };
  const share = async () => {
    if (!navigator.share) { await copy(); return; }
    setError(''); setNotice('');
    try { await navigator.share({ title: t('Daftar hadiah bersama'), url }); }
    catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to share wishlist:', error);
      setError('Gagal membuka menu berbagi. Salin tautan secara manual.');
    }
  };
  return <section className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <h2 className="text-lg font-semibold">{t('Bagikan daftar keinginan')}</h2>
    <p className="text-sm text-slate-600">{t('Salinan produk berlaku 30 hari. Perubahan daftar pribadi tidak mengubah salinan. Identitas dan catatan pribadi tidak dibagikan.')}</p>
    {guest && <p className="text-sm text-amber-800">{t('Hapus cache tamu menghilangkan akses pencabutan tautan. Salinan publik tetap berlaku sampai kedaluwarsa.')}</p>}
    <button disabled={empty || busy || loading} onClick={() => void create()} className="button-primary">{t('Buat tautan 30 hari')}</button>
    {url && <div className="space-y-2">
      <label className="block text-sm">{t('Tautan publik')}
        <input readOnly value={url} onFocus={(event) => event.target.select()} className="field mt-1" />
      </label>
      <p className="text-xs text-slate-500">{t('Simpan tautan sekarang. Token hanya ditampilkan saat dibuat.')}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => void copy()} className="button-secondary">{t('Salin tautan')}</button>
        <button onClick={() => void share()} className="button-secondary">{t('Bagikan')}</button>
      </div>
    </div>}
    {loading && <p role="status">{t('Memuat tautan...')}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{message(error)}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700">{message(notice)}</p>}
    <ul className="space-y-2">
      {shares.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm">
        <span>{t('Berlaku sampai {date}', { date: new Date(entry.expiresAt).toLocaleString(locale) })}</span>
        {entry.revokedAt ? <span>{t('Dicabut')}</span> : new Date(entry.expiresAt).getTime() <= Date.now() ? <span>{t('Kedaluwarsa')}</span>
          : <button disabled={busy} className="button-secondary" onClick={async () => {
            setBusy(true); setError('');
            try {
              await wishlistShareApi.revoke(entry.id);
              setShares((old) => old.map((item) => item.id === entry.id ? { ...item, revokedAt: new Date().toISOString() } : item));
              setUrl('');
              setNotice('Tautan dicabut.');
            } catch (error) { setError(wishlistShareError(error)); }
            finally { setBusy(false); }
          }}>{t('Cabut tautan')}</button>}
      </li>)}
    </ul>
  </section>;
}
