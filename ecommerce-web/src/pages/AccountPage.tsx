import { useI18n } from '../i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Heart, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../services/auth';

export const AccountPage = () => {
  const { t, message, locale } = useI18n();
  const { user, isLoading, error, logout } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
      <h1 className="section-title">{t("Akun Saya")}</h1>
      {(error || logoutError) && <p role="alert" className="text-sm text-red-600">{logoutError || error}</p>}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
            {user ? <span className="text-lg font-semibold">{user.fullName.charAt(0)}</span> : <User className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{user?.fullName || t("Belum masuk")}</h2>
            <p className="break-words text-sm text-slate-500">{user?.email || t("Masuk dengan Google atau kode email")}</p>
            {user && <p className="mt-2 flex items-center gap-1 text-xs text-sky-700"><ShieldCheck className="h-3.5 w-3.5" /> {" " + t("Email Terverifikasi")}</p>}
          </div>
        </div>
        {isLoading ? <p role="status" className="mt-6 text-sm text-slate-500">{t("Memeriksa sesi...")}</p>
          : !user ? <Link to="/auth" className="button-primary mt-6 w-full">{t("Masuk / Daftar")}</Link>
          : <button onClick={async () => {
              try { await logout(); setLogoutError(null); }
              catch (err) { setLogoutError(authErrorMessage(err)); }
            }} className="button-secondary mt-6 w-full">{t("Keluar")}</button>}
      </section>
      <nav aria-label={t("Menu akun")} className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {[{ to: '/wishlist', icon: Heart, title: t("Wishlist & Produk Disimpan"), subtitle: t("Lihat barang impian dan pantau penurunan harga") },
          { to: '/track', icon: Package, title: t("Pesanan Saya"), subtitle: t("Lacak pengiriman dan pengambilan pesanan") }].map(({ to, icon: Icon, title, subtitle }) =>
          <Link key={to} to={to} className="flex items-center gap-3 p-5 hover:bg-slate-50">
            <Icon className="h-5 w-5 shrink-0 text-sky-600" />
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-xs text-slate-500">{subtitle}</span></span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>)}
      </nav>
    </div>
  );
};
