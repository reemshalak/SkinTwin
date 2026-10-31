"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";
import { EASE } from "../motion";
import { ProductArt } from "../ProductArt";
import { COHORT } from "@/lib/cohort";
import { ACTIVE_LABELS, PRODUCTS } from "@/lib/products";
import { outcomeFor } from "@/lib/twins";

const SEGMENTS: [string, string][] = [
  ["oily-breakout", "Oily, breakout-prone"],
  ["combination", "Combination"],
  ["balanced", "Balanced"],
  ["mature", "Mature"],
  ["dry-sensitive", "Dry & sensitive"],
];

// The product whose results differ most between skin types, from the sample cohort.
const DATA = (() => {
  const rows = PRODUCTS.filter((p) => p.category !== "makeup").map((p) => {
    const all = outcomeFor(p.id, COHORT.map((member) => ({ member })));
    const segs = SEGMENTS.map(([id, label]) => ({ id, label, o: outcomeFor(p.id, COHORT.filter((m) => m.archetype === id).map((member) => ({ member }))) }));
    const imp = segs.map((s) => s.o.improvedPct);
    return { p, all, segs, spread: Math.max(...imp) - Math.min(...imp) };
  });
  const pick = rows.filter((r) => r.all.avgRating >= 3.6).sort((a, b) => b.spread - a.spread)[0];
  pick.segs.sort((a, b) => b.o.improvedPct - a.o.improvedPct);
  return pick;
})();

const CATEGORY: Record<string, string> = { cleanser: "face wash", serum: "serum", treatment: "treatment", moisturizer: "moisturiser", exfoliant: "exfoliating toner", sunscreen: "sunscreen" };
// Unbranded on purpose: these outcomes are sample data, not claims about a real product.
const GENERIC = `A popular ${DATA.p.actives[0] ? ACTIVE_LABELS[DATA.p.actives[0]].toLowerCase() : ""} ${CATEGORY[DATA.p.category] ?? "product"}`.replace(/\s+/g, " ");

export function SplitRating() {
  const { p, all, segs } = DATA;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="rounded-[2rem] border border-line bg-surface p-6 text-center shadow-card">
        <div className={`relative mx-auto aspect-square w-40 rounded-full bg-gradient-to-br ${p.hue}`}>
          <ProductArt product={{ ...p, brand: "BESTSELLER" }} className="absolute inset-[12%] h-[76%] w-[76%]" />
        </div>
        <p className="mt-4 text-sm font-medium">{GENERIC}</p>
        <p className="text-xs text-muted">One of the most reviewed products in its category</p>
        <p className="mt-3 flex items-center justify-center gap-1 font-display text-4xl">
          {all.avgRating} <Star className="size-6 fill-rose text-rose" />
        </p>
        <p className="text-xs text-muted">average of {all.n} reviews</p>
      </div>

      <div>
        <p className="text-sm text-muted">Same product, split by measured skin type:</p>
        <ul className="mt-4 space-y-4">
          {segs.map((s, i) => (
            <li key={s.id}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span>{s.label}</span>
                <span className="text-xs">
                  <b className={`font-medium ${s.o.improvedPct >= 60 ? "text-good" : s.o.improvedPct < 40 ? "text-bad" : "text-ink"}`}>{s.o.improvedPct}% improved</b>
                  {s.o.worsenedPct >= 15 && <span className="ms-2 text-bad">{s.o.worsenedPct}% got worse</span>}
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-blush-100">
                <motion.div
                  className="h-full bg-good"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.o.improvedPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.12, ease: EASE }}
                />
                <motion.div
                  className="ms-auto h-full bg-bad/80"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.o.worsenedPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.12, ease: EASE }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-muted">Sample community data · results measured by before/after skin scans.</p>
      </div>
    </div>
  );
}
