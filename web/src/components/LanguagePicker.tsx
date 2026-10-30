"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LANGS, useT } from "@/lib/i18n";

// Language switcher: a globe button with a small menu (header, footer), or a
// full row of options (settings).
export function LanguagePicker({ variant = "menu", up = false }: { variant?: "menu" | "row"; up?: boolean }) {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  if (variant === "row") {
    return (
      <div role="radiogroup" aria-label={t("nav.language")} className="flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <button key={l.id} role="radio" aria-checked={lang === l.id} onClick={() => setLang(l.id)} className={`rounded-full px-4 py-2 text-sm transition ${lang === l.id ? "bg-plum-deep text-white" : "border border-line text-ink hover:border-plum"}`}>
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  const current = LANGS.find((l) => l.id === lang)!;
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label={`${t("nav.language")}: ${current.label}`} aria-expanded={open} className="flex h-9 items-center gap-1 rounded-full px-2 text-xs font-medium text-plum hover:bg-blush-100">
        <Globe className="size-[18px]" />
        <span>{current.short}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: up ? 6 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute end-0 z-40 w-44 rounded-2xl border border-line bg-surface p-1 shadow-soft ${up ? "bottom-11" : "top-11"}`}
          >
            {LANGS.map((l) => (
              <li key={l.id}>
                <button onClick={() => { setLang(l.id); setOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-sm text-ink hover:bg-blush-50">
                  {l.label}
                  {lang === l.id && <Check className="size-4 text-plum" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
