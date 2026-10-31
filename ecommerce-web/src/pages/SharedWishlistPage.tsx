import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { wishlistShareApi } from '../services/api';
import { reservationStorageKey, SHARE_TOKEN_PATTERN, wishlistShareError } from '../services/wishlistShare';
import type { SharedWishlist } from '../types/wishlistShare';
import { ResponsiveImage } from '../components/ResponsiveImage';

export function SharedWishlistPage() {
  const { token = '' } = useParams<{ token: string }>();
  return <SharedWishlistView key={token} token={token} />;
}

export function SharedWishlistView({ token }: { token: string }) {
  const { t, message, locale } = useI18n();
  const [snapshot, setSnapshot] = useState<SharedWishlist | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [storageWarning, setStorageWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  useEffect(() => {
    const entries = [['robots', 'noindex, nofollow, noarchive'], ['referrer', 'no-referrer']];
    const cleanup = entries.map(([name, value]) => {
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      const meta = existing ?? document.createElement('meta');
      const previous = existing?.content;
      meta.name = name; meta.content = value;
      if (!existing) document.head.appendChild(meta);
      return () => { if (existing) meta.content = previous; else meta.remove(); };
    });
    return () => cleanup.forEach((restore) => restore());
  }, []);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    if (!SHARE_TOKEN_PATTERN.test(token)) {
      setError('Tautan tidak tersedia, sudah kedaluwarsa, atau dicabut.');
      setLoading(false);
      return () => { mounted.current = false; };
    }
    wishlistShareApi.get(token, controller.signal).then((data) => {
      if (!mounted.current) return;
      setSnapshot(data); setLoading(false);
      try {
        const saved: Record<string, string> = {};
        for (const item of data.items) {
          const key = localStorage.getItem(reservationStorageKey(token, item.id));
          if (key) saved[item.id] = key;
        }
        setKeys(saved);
      } catch (error) {
        console.error('Failed to load private reservation keys:', error);
        setStorageWarning('Kunci reservasi tidak dapat dimuat. Gunakan kunci pemulihan pribadi.');
      }
    }, (error) => {
      if (mounted.current && !controller.signal.aborted) { setError(wishlistShareError(error)); setLoading(false); }
    });
    return () => { mounted.current = false; controller.abort(); };
  }, [token]);
  useEffect(() => {
    if (!snapshot) return;
    let timer: number;
    const check = () => {
      const delay = new Date(snapshot.expiresAt).getTime() - Date.now();
      if (!Number.isFinite(delay)) {
        setSnapshot(null);
        setError('Waktu kedaluwarsa dari server tidak valid.');
      } else if (delay <= 0) {
        setSnapshot(null);
        setError('Tautan tidak tersedia, sudah kedaluwarsa, atau dicabut.');
      } else timer = window.setTimeout(check, Math.min(delay, 86400000));
    };
    check();
    return () => window.clearTimeout(timer);
  }, [snapshot]);

  const update = async (itemId: string, cancel: boolean) => {
    setBusy(itemId); setError('');
    try {
      if (cancel) {
        const key = keys[itemId];
        if (!key) { setError('Kunci pembatalan wajib diisi.'); return; }
        await wishlistShareApi.cancel(token, itemId, key);
        if (!mounted.current) return;
        setKeys((old) => { const next = { ...old }; delete next[itemId]; return next; });
        try { localStorage.removeItem(reservationStorageKey(token, itemId)); }
        catch (error) {
          console.error('Failed to remove private reservation key:', error);
          setStorageWarning('Reservasi dibatalkan, tetapi kunci lokal tidak dapat dihapus.');
        }
      } else {
        const { cancellationKey } = await wishlistShareApi.reserve(token, itemId);
        if (!SHARE_TOKEN_PATTERN.test(cancellationKey)) throw new Error('Kunci reservasi dari server tidak valid.');
        try { localStorage.setItem(reservationStorageKey(token, itemId), cancellationKey); }
        catch (error) {
          console.error('Failed to save private reservation key:', error);
          if (mounted.current) setStorageWarning('Reservasi berhasil, tetapi kunci tidak tersimpan. Salin kunci pribadi sebelum meninggalkan halaman.');
        }
        if (!mounted.current) return;
        setKeys((old) => ({ ...old, [itemId]: cancellationKey }));
      }
      setSnapshot((old) => old && { ...old, items: old.items.map((item) => item.id === itemId ? { ...item, reserved: !cancel } : item) });
      const refreshed = await wishlistShareApi.get(token);
      if (mounted.current) setSnapshot(refreshed);
    } catch (error) {
      if (mounted.current) {
        if (wishlistShareError(error) === 'Tautan tidak tersedia, sudah kedaluwarsa, atau dicabut.') setSnapshot(null);
        setError(wishlistShareError(error));
      }
    }
    finally { if (mounted.current) setBusy(''); }
  };

  return <div className="container-custom space-y-5 py-8">
    <h1 className="section-title">{t('Daftar hadiah bersama')}</h1>
    <p className="text-sm text-slate-600">{t('Reservasi hanya niat memberi hadiah, bukan bukti pembelian atau penahanan stok. Harga dan ketersediaan terbaru ada di halaman produk.')}</p>
    {loading && <p role="status">{t('Memuat daftar bersama...')}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{message(error)}</p>}
    {storageWarning && <p role="alert" className="text-sm text-amber-800">{message(storageWarning)}</p>}
    {snapshot && <>
      <p className="text-sm">{t('Berlaku sampai {date}', { date: new Date(snapshot.expiresAt).toLocaleString(locale) })}</p>
      <div className="product-grid">
        {snapshot.items.map((item) => <article key={item.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Link to={`/products/${encodeURIComponent(item.productId)}`}>
            <ResponsiveImage src={item.primaryImageUrl} alt={item.productName} preset="card" className="aspect-[4/3] w-full rounded-xl object-cover" />
            <h2 className="mt-3 font-semibold">{item.productName}</h2>
          </Link>
          <p className="text-sm text-slate-500">{item.variantName}</p>
          <p className="text-sm">{t('Jumlah:')} {item.quantity}</p>
          <p className="text-sm font-medium">{item.reserved ? t('Sudah direservasi') : t('Tersedia untuk hadiah')}</p>
          {!item.reserved && <button disabled={!!busy} className="button-primary w-full" onClick={() => void update(item.id, false)}>{t('Reservasi hadiah')}</button>}
          {item.reserved && <details>
            <summary className="cursor-pointer text-sm text-sky-700">{t('Batalkan dengan kunci pribadi')}</summary>
            <label className="mt-2 block text-sm">{t('Kunci pembatalan pribadi')}
              <input autoComplete="off" value={keys[item.id] ?? ''} onChange={(event) => setKeys((old) => ({ ...old, [item.id]: event.target.value }))}
                className="field mt-1" />
            </label>
            <p className="mt-2 text-xs text-slate-500">{t('Jangan bagikan kunci ini. Simpan untuk membatalkan reservasi di perangkat lain.')}</p>
            <button disabled={!!busy || !keys[item.id]} className="button-secondary mt-2 w-full" onClick={() => void update(item.id, true)}>{t('Batalkan reservasi')}</button>
          </details>}
          {keys[item.id] && item.reserved && <p className="break-all text-xs text-slate-500">{t('Kunci pemulihan: {key}', { key: keys[item.id] })}</p>}
        </article>)}
      </div>
    </>}
    <Link to="/wishlist" className="button-secondary">{t('Buka daftar pribadi')}</Link>
  </div>;
}
