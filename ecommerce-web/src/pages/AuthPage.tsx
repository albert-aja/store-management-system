import { useI18n } from '../i18n';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../services/auth';

export const AuthPage: React.FC = () => {
  const { t, message, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) navigate('/account', { replace: true });
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    if (!sentTo) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sentTo]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    const target = (sentTo || email).trim();
    await auth.sendEmailOtp(target);
    setSentTo(target);
    setCode('');
    setNow(Date.now());
    setResendAt(Date.now() + 60000);
  };
  const disabled = busy || auth.isLoading;
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-8 sm:py-12">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 text-white"><Store className="h-6 w-6" /></div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("Masuk ke SMS Mart")}</h1>
        <p className="text-sm leading-6 text-slate-500">{t("Masuk atau daftar dengan Google atau kode email. Tanpa kata sandi.")}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        {(error || auth.error) && <p role="alert" className="text-sm text-red-600">{message(error || auth.error)}</p>}
        {auth.isLoading && <p role="status" className="text-sm text-slate-500">{t("Memeriksa sesi...")}</p>}
        <button type="button" disabled={disabled} onClick={() => void run(auth.loginWithGoogle)}
          className="button-secondary w-full">
          {t("Lanjutkan dengan Google")}</button>
        <p className="text-xs text-center text-slate-400">{t("atau gunakan email")}</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          void run(sentTo ? () => auth.verifyEmailOtp(sentTo, code) : sendCode);
        }} className="space-y-4">
          <label className="block text-sm font-medium">
            {t("Alamat Email")}<div className="relative mt-1">
              <input type="email" required autoComplete="email" value={sentTo || email} disabled={!!sentTo || disabled}
                onChange={(event) => setEmail(event.target.value)}
                className="field pl-11" placeholder={t('nama@email.com')} />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </label>
          {sentTo && <>
            <p role="status" className="text-xs text-slate-500">{t('Kode dikirim ke {email}. Periksa kotak masuk atau spam.', { email: sentTo })}</p>
            <label className="block text-sm font-medium">
              {t("Kode OTP")}<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10}
                value={code} onChange={(event) => setCode(event.target.value)} disabled={disabled}
                className="field mt-1" />
            </label>
          </>}
          <button type="submit" disabled={disabled}
            className="button-primary w-full">
            {disabled ? t("Memproses...") : sentTo ? t("Verifikasi & Masuk") : t("Kirim Kode OTP")}
          </button>
        </form>
        {sentTo && <div className="flex justify-between text-xs text-sky-600">
          <button type="button" disabled={disabled || remaining > 0} onClick={() => void run(sendCode)}>
            {remaining > 0 ? t('Kirim ulang ({seconds}s)', { seconds: remaining }) : t("Kirim ulang kode")}
          </button>
          <button type="button" disabled={disabled} onClick={() => { setSentTo(null); setCode(''); setError(null); }}>
            {t("Ganti email")}</button>
        </div>}
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> {" " + t("Email diverifikasi sebelum akun digunakan.")}</p>
      </div>
    </div>
  );
};
