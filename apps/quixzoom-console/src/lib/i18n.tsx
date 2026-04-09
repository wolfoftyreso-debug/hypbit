import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from "react";

export type Locale = "en" | "sv";

// ── Persistent store ──
const STORAGE_KEY = "quixzoom-locale";

let _locale: Locale = (localStorage.getItem(STORAGE_KEY) as Locale) || "en";
const _listeners = new Set<() => void>();

function notify() { _listeners.forEach(fn => fn()); }

export function setLocale(l: Locale) {
  _locale = l;
  localStorage.setItem(STORAGE_KEY, l);
  document.documentElement.lang = l;
  notify();
}

export function getLocale(): Locale { return _locale; }

export function useLocale(): [Locale, (l: Locale) => void] {
  const locale = useSyncExternalStore(
    (cb) => { _listeners.add(cb); return () => _listeners.delete(cb); },
    () => _locale,
  );
  return [locale, setLocale];
}

// ── Translation helper ──

type TranslationMap = Record<string, string>;

const translations: Record<Locale, TranslationMap> = {
  en: {},
  sv: {},
};

export function registerTranslations(locale: Locale, map: TranslationMap) {
  Object.assign(translations[locale], map);
}

export function t(key: string, params?: Record<string, string | number>): string {
  const val = translations[_locale][key] || translations.en[key] || key;
  if (!params) return val;
  return val.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function useT() {
  const [locale] = useLocale();
  // Return a bound t that re-renders on locale change
  return useCallback((key: string, params?: Record<string, string | number>) => {
    return t(key, params);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps
}
