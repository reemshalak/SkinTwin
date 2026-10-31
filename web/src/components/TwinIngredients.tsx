"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import { personAvatar } from "@/lib/people";
import { ACTIVE_LABELS, PRODUCTS, productById } from "@/lib/products";
import type { Twin } from "@/lib/twins";
import type { Active } from "@/lib/types";

const EMOJI: Partial<Record<Active, string>> = {
  niacinamide: "🌿", bha: "🫧", aha: "✨", retinoid: "🌙", vitamin_c: "🍊", ceramides: "🧱", hyaluronic_acid: "💧", spf: "☀️", benzoyl_peroxide: "🎯",
};
const HUE = ["from-[#F6EDF3] to-[#F0C9D9]", "from-[#EEF6F6] to-[#CBE7E6]", "from-[#FFF6E5] to-[#F8DDAA]", "from-[#EEF3F6] to-[#CFE0EA]", "from-[#F7F2F6] to-[#E7DDF0]"];

// Which ingredients measurably helped your twins: bigger bubble, more twins improved.
export function TwinIngredients({ twins }: { twins: Twin[] }) {
  const rows = useMemo(() => {
    const by = new Map<Active, { n: number; good: number; people: Set<string> }>();
    for (const { member } of twins) {
      for (const t of member.trials) {
        const p = productById(t.productId);
        if (!p) continue;
        const gain = Object.values(t.delta).reduce((a, b) => a + (b ?? 0), 0);
        for (const a of p.actives) {
          if (a === "fragrance" || a === "occlusive") continue;
          const r = by.get(a) ?? { n: 0, good: 0, people: new Set<string>() };
          r.n++;
          if (gain >= 5) {
            r.good++;
            if (member.personId) r.people.add(member.personId);
          }
          by.set(a, r);
        }
      }
    }
    return [...by.entries()]
      .filter(([, r]) => r.n >= 5)
      .map(([a, r]) => ({ a, n: r.n, pct: Math.round((r.good / r.n) * 100), people: [...r.people].slice(0, 3) }))
      .sort((x, y) => y.pct - x.pct)
      .slice(0, 5);
  }, [twins]);
  const [open, setOpen] = useState<Active | null>(null);
  if (!rows.length) return null;
  const sel = rows.find((r) => r.a === open);

  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium">Ingredients that worked for your twins</h2>
      <ul className="-mx-5 mt-4 flex items-end gap-4 overflow-x-auto px-5 pt-6 pb-2 lg:mx-0 lg:px-0">
        {rows.map((r, i) => {
          const size = 84 + (r.pct / 100) * 56;
          return (
            <motion.li key={r.a} initial={{ opacity: 0, y: 16, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 16 }} className="flex shrink-0 flex-col items-center">
              {/* Twins who improved with it */}
              <span className="mb-[-14px] flex -space-x-2.5" style={{ zIndex: 1 }}>
                {r.people.map((id) => <Avatar key={id} config={personAvatar(id)} className="size-8 text-xs ring-2 ring-surface" />)}
              </span>
              <motion.button
                onClick={() => setOpen(open === r.a ? null : r.a)}
                aria-pressed={open === r.a}
                whileHover={{ y: -4 }}
                animate={{ y: [0, -3, 0] }}
                transition={{ y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" } }}
                style={{ width: size, height: size }}
                className={`grid place-items-center rounded-full bg-gradient-to-br text-center text-[#3a2430] shadow-card ${HUE[i % HUE.length]} ${open === r.a ? "ring-2 ring-plum ring-offset-2 ring-offset-blush-50" : ""}`}
              >
                <span>
                  <span className="block text-2xl leading-none">{EMOJI[r.a] ?? "🧴"}</span>
                  <span className="block font-display text-lg leading-tight">{r.pct}%</span>
                </span>
              </motion.button>
              <span className="mt-2 max-w-[8rem] text-center text-xs font-medium text-ink">{ACTIVE_LABELS[r.a]}</span>
              <span className="text-[10px] text-muted">{r.n} tries</span>
            </motion.li>
          );
        })}
      </ul>
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 rounded-[1.5rem] bg-blush-50 p-4 text-sm">
              <p>
                <b className="font-medium">{sel.pct}%</b> of your twins who tried {ACTIVE_LABELS[sel.a].toLowerCase()} improved by 5+ points. Products with it:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRODUCTS.filter((p) => p.actives.includes(sel.a)).slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-plum hover:border-plum">{p.name}</Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
