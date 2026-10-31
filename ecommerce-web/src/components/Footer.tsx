import { useI18n } from '../i18n';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck, Truck } from 'lucide-react';

export const Footer = () => {
  const { t, message, locale } = useI18n();
  return (
  <footer className="mt-12 border-t border-slate-200 bg-white py-8 text-sm text-slate-500">
    <div className="container-custom space-y-6">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-2">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900"><Store className="h-5 w-5 text-sky-600" /> SMS Mart</Link>
          <p>{t("Elektronik dan furniture untuk rumah Anda.")}</p>
        </div>
        <nav aria-label={t("Menu footer")} className="flex flex-wrap gap-6">
          <Link to="/products" className="hover:text-sky-700">{t("Katalog")}</Link>
          <Link to="/wishlist" className="hover:text-sky-700">{t("Wishlist")}</Link>
          <Link to="/track" className="hover:text-sky-700">{t("Lacak Pesanan")}</Link>
          <a href="mailto:layanan@smsmart.co.id" className="hover:text-sky-700">{t("Hubungi Kami")}</a>
        </nav>
      </div>
      <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-6 text-xs sm:flex-row">
        <p>© {new Date().getFullYear()} {" " + t("SMS Mart. Semua hak dilindungi.")}</p>
        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> {" " + t("Garansi resmi")}</span>
          <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4" /> {" " + t("Kirim atau ambil di toko")}</span>
        </div>
      </div>
    </div>
  </footer>
  );
};
