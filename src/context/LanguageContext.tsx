import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANGUAGE_KEY } from "../config.ts";
import { messages, type Locale, type MessageKey } from "../i18n/messages.ts";

type LanguageApi = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  m: { [K in MessageKey]: string };
};

const LanguageContext = createContext<LanguageApi | null>(null);

function readLocale(): Locale {
  try {
    if (typeof localStorage === "undefined") return "ro";
    return localStorage.getItem(LANGUAGE_KEY) === "ru" ? "ru" : "ro";
  } catch {
    return "ro";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readLocale);
  const m = useMemo(() => messages(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale === "ru" ? "ru" : "ro";
    try {
      localStorage.setItem(LANGUAGE_KEY, locale);
    } catch {
      /* локальное хранилище может быть недоступно */
    }
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, m }), [locale, m]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("Language provider is missing.");
  return context;
}
