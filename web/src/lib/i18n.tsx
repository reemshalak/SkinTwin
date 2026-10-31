"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AutoArabic } from "@/components/AutoArabic";
import { DICTS,LANG_KEY as KEY, setCurrentLang, tr, type Lang, type TKey } from "./i18n-core";

export { LANGS, tr } from "./i18n-core";
export type { Lang, TKey } from "./i18n-core";

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey, vars?: Record<string, string | number>) => string } | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Lang | null;
      if (saved && saved in DICTS) setLangState(saved);
    } catch {}
  }, []);
  setCurrentLang(lang);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback((k: TKey, vars?: Record<string, string | number>) => tr(k, vars), [lang]);
  // Remount the app on a language change so every label (including shared
  // ones read outside React) re-renders in the new language.
  return (
    <Ctx.Provider value={{ lang, setLang, t }}>
      <div key={lang} className="contents">{children}</div>
      {lang === "ar" && <AutoArabic />}
    </Ctx.Provider>
  );
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useT outside I18nProvider");
  return ctx;
}
