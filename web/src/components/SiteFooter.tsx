"use client";

import Link from "next/link";
import { LanguagePicker } from "./LanguagePicker";
import { ThemeSwitch } from "./ThemeSwitch";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-muted lg:px-8">
        <p className="font-display text-base text-plum-deep">SkinTwin</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/twins" className="hover:text-plum">{t("nav.twins")}</Link>
          <Link href="/journal" className="hover:text-plum">{t("foot.journal")}</Link>
          <Link href="/settings" className="hover:text-plum">{t("foot.settings")}</Link>
          <Link href="/merchant" className="hover:text-plum">{t("foot.brands")}</Link>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeSwitch withLabel />
          <LanguagePicker up />
        </div>
        <p className="w-full text-[11px] leading-relaxed">{t("foot.note")}</p>
      </div>
    </footer>
  );
}
