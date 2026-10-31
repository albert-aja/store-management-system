import { formatDateOnly, useI18n } from '../i18n';
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { storefrontApi } from "../services/api";
import type { DeliverySchedule } from "../types";

function errorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error) && error.response?.data.message) {
    return error.response.data.message;
  }
  return error instanceof Error ? error.message : "Gagal memuat jadwal pengiriman.";
}

function ScheduleRequest({ stop, onSaved }: { stop: DeliverySchedule; onSaved: () => Promise<void> }) {
  const { t, message, locale } = useI18n();
  const [date, setDate] = useState("");
  const [window, setWindow] = useState<"MORNING" | "AFTERNOON">("MORNING");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  return (
    <section className="rounded-xl border border-slate-200 p-4 space-y-3">
      <h3 className="font-semibold">{stop.deliveryOrderNumber}</h3>
      <p className="text-sm text-slate-600">
        {t("Jadwal:") + " "}{stop.deliveryDate ? formatDateOnly(stop.deliveryDate, locale) : t("Belum ditentukan")} · {stop.deliveryWindow === "MORNING"
          ? "09:00–12:00 WIB" : stop.deliveryWindow === "AFTERNOON" ? "12:00–17:00 WIB" : t("Jam belum ditentukan")}
      </p>
      {stop.plannedDispatchAt && <p className="text-sm text-slate-600">
        {t("Rencana berangkat:") + " "}{new Date(stop.plannedDispatchAt).toLocaleString(locale, { timeZone: "Asia/Jakarta" })} WIB
      </p>}
      {stop.requests.map((request) => (
        <p key={request.id} className="text-sm">
          {formatDateOnly(request.requestedDate, locale)} · {request.requestedWindow === "MORNING" ? "09:00–12:00" : "12:00–17:00"} WIB:
          {" "}{request.status === "PENDING" ? t("Menunggu persetujuan") : request.status === "APPROVED" ? t("Disetujui") : t("Ditolak")}
          {request.decisionNotes && ` — ${request.decisionNotes}`}
        </p>
      ))}
      {!stop.eligible && <p className="text-sm text-slate-600">{message(stop.unavailableReason)}</p>}
      {success && <p role="status" className="text-sm text-emerald-700">{t("Permintaan terkirim. Jadwal belum berubah sampai disetujui dispatcher.")}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{message(error)}</p>}
      {stop.eligible && !success && <form className="space-y-3" onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true); setError("");
        try {
          await storefrontApi.requestDeliveryReschedule(stop.deliveryOrderId, {
            requestedDate: date, requestedWindow: window, reason: reason.trim() || undefined,
          });
          setSuccess(true);
          await onSaved();
        } catch (error) { setError(errorMessage(error)); }
        finally { setBusy(false); }
      }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">{t("Tanggal pengiriman baru")}<input required type="date" value={date} onChange={(event) => setDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
          </label>
          <label className="text-sm">{t("Waktu pengiriman (WIB)")}<select value={window} onChange={(event) => {
              if (event.target.value === "MORNING" || event.target.value === "AFTERNOON") setWindow(event.target.value);
            }} className="mt-1 w-full rounded-lg border border-slate-300 p-2">
              <option value="MORNING">{t("Pagi · 09:00–12:00")}</option>
              <option value="AFTERNOON">{t("Siang · 12:00–17:00")}</option>
            </select>
          </label>
        </div>
        <label className="block text-sm">{t("Alasan (opsional)")}<textarea value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
        </label>
        <button disabled={busy || !date} className="btn-primary w-full sm:w-auto">
          {busy ? t("Mengirim...") : t("Ajukan perubahan jadwal")}
        </button>
      </form>}
    </section>
  );
}

function CustomerSchedules({ orderId }: { orderId: string }) {
  const { t, message, locale } = useI18n();
  const [stops, setStops] = useState<DeliverySchedule[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    storefrontApi.getDeliverySchedules(orderId).then(
      (data) => { if (active) setStops(data); },
      (error) => { if (active) setError(errorMessage(error)); },
    );
    return () => { active = false; };
  }, [orderId]);
  const refresh = async () => setStops(await storefrontApi.getDeliverySchedules(orderId));
  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-red-700">{message(error)}</p>}
      {!stops && !error && <p>{t("Memuat jadwal...")}</p>}
      {stops?.length === 0 && <p className="text-sm text-slate-600">{t("Belum ada pengiriman yang dijadwalkan dispatcher.")}</p>}
      {stops?.map((stop) => <ScheduleRequest key={stop.deliveryOrderId} stop={stop} onSaved={refresh} />)}
    </div>
  );
}

export function DeliveryReschedulePanel({ orderId }: { orderId: string }) {
  const { t, message, locale } = useI18n();
  const { user, isLoading } = useAuth();
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-3">
      <h2 className="text-lg font-bold">{t("Ubah jadwal pengiriman")}</h2>
      <p className="text-sm text-slate-600">
        {t("Ajukan paling lambat 24 jam sebelum rencana berangkat. Perubahan menunggu persetujuan dispatcher. Semua tanggal dan jam memakai WIB (Asia/Jakarta).")}</p>
      {isLoading ? <p>{t("Memeriksa akun...")}</p> : !user
        ? <Link to="/auth" className="text-sky-700 underline">{t("Masuk untuk mengatur pengiriman milik Anda")}</Link>
        : <CustomerSchedules key={`${user.customerId}:${orderId}`} orderId={orderId} />}
    </section>
  );
}
