import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { english, indonesian, type TranslationKey } from './catalog';

export type Language = 'id' | 'en';
export const LANGUAGE_STORAGE_KEY = 'sms_storefront_language';
type Parameters = Record<string, string | number>;

export function formatDateOnly(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid delivery date: ${value}`);
  }
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export function translate(key: TranslationKey, language: Language, parameters: Parameters = {}): string {
  const text = language === 'en' ? english[key] : indonesian[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => String(parameters[name] ?? placeholder));
}

export function translateMessage(message: string, language: Language): string {
  return Object.prototype.hasOwnProperty.call(english, message) ? translate(message as TranslationKey, language) : message;
}

function functions(language: Language) {
  return {
    t: (key: TranslationKey, parameters?: Parameters) => translate(key, language, parameters),
    message: (text: string) => translateMessage(text, language),
    locale: language === 'id' ? 'id-ID' : 'en-US',
  };
}

const I18nContext = createContext({
  language: 'id' as Language,
  setLanguage: (_language: Language): void => { throw new Error('Language switch requires I18nProvider'); },
  storageError: '',
  ...functions('id'),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<{ language: Language; storageError: string }>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved !== null && saved !== 'id' && saved !== 'en') throw new Error('Invalid stored language preference');
      return { language: saved === 'en' ? 'en' : 'id', storageError: '' };
    } catch (error) {
      console.error('Failed to load language preference:', error);
      return { language: 'id', storageError: 'Pilihan bahasa tidak dapat dimuat.' };
    }
  });
  const { language, storageError } = preference;
  const setLanguage = useCallback((next: Language) => {
    if (next !== 'id' && next !== 'en') throw new Error('Unsupported language');
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      setPreference({ language: next, storageError: '' });
    } catch (error) {
      console.error('Failed to save language preference:', error);
      setPreference({ language: next, storageError: 'Pilihan bahasa tidak dapat disimpan.' });
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'id' ? 'SMS Mart - Elektronik & Furniture' : 'SMS Mart - Electronics & Furniture';
    const onStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) {
        if (event.newValue !== null && event.newValue !== 'id' && event.newValue !== 'en') {
          console.error('Invalid language preference received from another tab');
          setPreference({ language: 'id', storageError: 'Pilihan bahasa tidak dapat dimuat.' });
          return;
        }
        setPreference({ language: event.newValue === 'en' ? 'en' : 'id', storageError: '' });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, storageError, ...functions(language) }), [language, setLanguage, storageError]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitcher() {
  const { language, setLanguage, storageError, t } = useI18n();
  return (
    <div className="relative shrink-0">
      <select aria-label={t('Bahasa')} value={language}
        onChange={(event) => { if (event.target.value === 'id' || event.target.value === 'en') setLanguage(event.target.value); }}
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700">
        <option value="id">ID</option>
        <option value="en">EN</option>
      </select>
      {storageError && <p role="alert" className="absolute right-0 top-full z-50 w-64 rounded-lg border border-red-200 bg-white p-2 text-xs text-red-700">{translateMessage(storageError, language)}</p>}
    </div>
  );
}
