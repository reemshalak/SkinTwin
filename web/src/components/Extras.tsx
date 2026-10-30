"use client";

import Link from "next/link";
import { Camera, FlaskConical, Heart, ShoppingBag } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";

// The side tools, gathered in one place so the main pages stay on the four questions.
const TOOLS = [
  { href: "/import", icon: ShoppingBag, k: "x.import" },
  { href: "/swipe", icon: Heart, k: "x.swipe" },
  { href: "/mix", icon: FlaskConical, k: "x.mix" },
  { href: "/mirror", icon: Camera, k: "x.mirror" },
] as const;

export function Extras() {
  const { t } = useT();
  return (
    <section id="extras" className="mt-10 scroll-mt-24">
      <h2 className="font-display text-2xl text-ink">{t("x.title" as TKey)}</h2>
      <p className="mt-1 text-sm text-muted">{t("x.sub" as TKey)}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map(({ href, icon: Icon, k }) => (
          <Link key={href} href={href} className="flex items-start gap-3 rounded-[1.5rem] border border-line bg-surface p-4 transition hover:shadow-card">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-100 text-plum"><Icon className="size-4" /></span>
            <span>
              <span className="block text-sm font-medium">{t(k as TKey)}</span>
              <span className="text-xs text-muted">{t(`${k}.d` as TKey)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
