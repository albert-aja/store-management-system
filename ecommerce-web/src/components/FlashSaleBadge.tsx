import { useI18n } from '../i18n';
import { useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";

interface Props {
  endsAt?: string | null;
  stockCount: number;
  compact?: boolean;
}

function formatRemaining(milliseconds: number, language: 'id' | 'en') {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return days > 0
    ? `${days}${language === 'id' ? 'h' : 'd'} ${String(hours).padStart(2, "0")}${language === 'id' ? 'j' : 'h'}`
    : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function FlashSaleBadge({ endsAt, stockCount, compact = false }: Props) {
  const { t, language } = useI18n();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = endsAt ? new Date(endsAt).getTime() - now : 0;
  if (!endsAt || remaining <= 0) return null;

  return (
    <div
      className={`rounded-lg border border-rose-200 bg-rose-50 text-rose-800 ${compact ? "px-2 py-1" : "p-3"}`}
    >
      <div className={`flex gap-1 text-xs font-semibold ${compact ? 'flex-col items-start' : 'flex-wrap items-center justify-between'}`}>
        <span className="inline-flex items-center gap-1">
          <Flame className="h-3.5 w-3.5" /> {" " + t("Flash Sale")}</span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Clock className="h-3.5 w-3.5" />
          {formatRemaining(remaining, language)}
        </span>
      </div>
      <div className={`${compact ? "mt-1" : "mt-2"} flex items-center gap-2`}>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-rose-200"
          aria-label={t('{count} unit tersedia', { count: stockCount })}
        >
          <div
            className="h-full rounded-full bg-rose-600 transition-all"
            style={{ width: `${Math.min(100, Math.max(4, stockCount * 10))}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-[10px] font-semibold">
          {t("Sisa") + " "}{stockCount}
        </span>
      </div>
    </div>
  );
}
