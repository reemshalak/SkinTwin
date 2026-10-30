"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Flame, Heart, Leaf, Search, Sparkles, Tag, Users, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Page } from "@/components/Page";
import { ProductVisual } from "@/components/ProductArt";
import { SaveHeart } from "@/components/SaveHeart";
import { SAMPLE_POSTS } from "@/lib/community";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { ACTIVE_LABELS, PRODUCTS } from "@/lib/products";
import { useStore } from "@/lib/store";
import { everyone, findTwins, fitScore, outcomeFor, type Outcome } from "@/lib/twins";
import { VERDICT_STYLE, verdictFor } from "@/lib/verdict";
import type { ConcernKey, Product } from "@/lib/types";

const CATEGORIES: { id: string; label: string; match: (p: Product) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "treat", label: "Serums & treatments", match: (p) => ["serum", "treatment", "exfoliant"].includes(p.category) },
  { id: "basics", label: "Moisturise & SPF", match: (p) => ["moisturizer", "sunscreen", "cleanser"].includes(p.category) },
  { id: "makeup", label: "Makeup", match: (p) => p.category === "makeup" },
];

const CONCERN_HUE: Record<ConcernKey, string> = {
  moisture: "from-[#EEF3F6] to-[#CFE0EA]",
  oiliness: "from-[#EEF6F6] to-[#CBE7E6]",
  redness: "from-[#FFF0F3] to-[#F7C7D2]",
  texture: "from-[#F7F2F6] to-[#E7DDF0]",
  pore: "from-[#F6EDF3] to-[#F0C9D9]",
  acne: "from-[#FBF0E8] to-[#F2D3C2]",
  radiance: "from-[#FFF6E5] to-[#F8DDAA]",
  wrinkle: "from-[#F7F2F6] to-[#E0D3EA]",
};

const helps = (p: Product, k: ConcernKey) => (p.effects[k] ?? 0) >= 4;
const fragranceFree = (p: Product) => !p.actives.includes("fragrance");

// "Trending": most posts in the last few weeks.
const TRENDING = (() => {
  const counts = new Map<string, number>();
  for (const post of SAMPLE_POSTS.slice(0, 60)) counts.set(post.productId, (counts.get(post.productId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
})();

type Row = { product: Product; o: Outcome; all: Outcome };

export default function ShopPage() {
  const { latest } = useStore();
  const [cat, setCat] = useState("all");
  const [concern, setConcern] = useState<ConcernKey | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [under25, setUnder25] = useState(false);
  const [q, setQ] = useState("");

  const rows = useMemo<Row[]>(() => {
    const twins = latest ? findTwins(latest.scores, latest.sampleId) : [];
    const all = everyone();
    return PRODUCTS.map((p) => ({ product: p, o: outcomeFor(p.id, twins), all: outcomeFor(p.id, all) })).sort((a, b) =>
      a.o.n >= 5 && b.o.n >= 5 ? fitScore(b.o) - fitScore(a.o) : b.o.n - a.o.n,
    );
  }, [latest]);

  const query = q.trim().toLowerCase();
  const filtering = Boolean(query || concern || freeOnly || under25 || cat !== "all");
  const c = CATEGORIES.find((x) => x.id === cat)!;
  const results = rows.filter(({ product: p }) => {
    if (!c.match(p)) return false;
    if (concern && !helps(p, concern)) return false;
    if (freeOnly && !fragranceFree(p)) return false;
    if (under25 && p.price >= 25) return false;
    if (query) {
      const hay = `${p.name} ${p.brand} ${p.category} ${p.actives.map((a) => ACTIVE_LABELS[a]).join(" ")} ${p.ingredients.join(" ")}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  // Your three lowest scores become the "for you" concern shortcuts.
  const myConcerns = latest ? [...CONCERN_KEYS].sort((a, b) => latest.scores[a] - latest.scores[b]).slice(0, 3) : [];
  const byId = (id: string) => rows.find((r) => r.product.id === id)!;
  const shelves: { id: string; title: string; icon: React.ReactNode; items: Row[] }[] = [
    ...(latest
      ? [
          { id: "twins", title: "Worked for your twins", icon: <Users className="size-4 text-good" />, items: rows.filter((r) => verdictFor(r.o, r.all).kind === "good").slice(0, 8) },
          {
            id: "risky",
            title: "Popular, but risky for you",
            icon: <Flame className="size-4 text-warn" />,
            items: rows.filter((r) => r.all.avgRating >= 3.6 && verdictFor(r.o, r.all).kind === "risky").slice(0, 8),
          },
        ]
      : []),
    { id: "trending", title: "Trending this week", icon: <Flame className="size-4 text-rose" />, items: TRENDING.slice(0, 8).map(byId) },
    { id: "gentle", title: "Fragrance-free & gentle", icon: <Leaf className="size-4 text-good" />, items: rows.filter((r) => fragranceFree(r.product) && !r.product.risks.some((x) => x.concern === "redness")).slice(0, 8) },
    { id: "budget", title: "Under $25", icon: <Tag className="size-4 text-warn" />, items: rows.filter((r) => r.product.price < 25).slice(0, 8) },
  ];

  const chip = (on: boolean) => `shrink-0 rounded-full px-4 py-1.5 text-xs transition ${on ? "bg-plum-deep text-white shadow-card" : "border border-line bg-surface text-muted hover:text-plum"}`;

  return (
    <Page>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">Products</p>
      <h1 className="mt-1 font-display text-3xl text-ink lg:text-4xl">What works for skin like yours</h1>

      <Link href="/swipe" className="group mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blush-100 to-blush-200 px-4 py-2 text-xs font-medium text-plum-deep transition hover:shadow-card">
        <Heart className="size-3.5 fill-current text-rose transition group-hover:scale-110" /> Can&apos;t decide? Quick pick
      </Link>

      <label className="relative mt-5 block">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products, brands or ingredients (try “niacinamide”)"
          aria-label="Search products"
          className="w-full rounded-full border border-line bg-surface py-3.5 pr-11 pl-11 text-sm shadow-card outline-none transition focus:border-plum"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search" className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-blush-100">
            <X className="size-4" />
          </button>
        )}
      </label>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {CATEGORIES.map((x) => (
          <button key={x.id} onClick={() => setCat(x.id)} aria-pressed={cat === x.id} className={chip(cat === x.id)}>{x.label}</button>
        ))}
        <span className="mx-1 w-px shrink-0 bg-line" />
        <button onClick={() => setFreeOnly((v) => !v)} aria-pressed={freeOnly} className={chip(freeOnly)}>Fragrance-free</button>
        <button onClick={() => setUnder25((v) => !v)} aria-pressed={under25} className={chip(under25)}>Under $25</button>
      </div>

      {/* Shop by concern: big colour tiles, yours first */}
      <section className="mt-6">
        <h2 className="text-sm font-medium">Shop by concern</h2>
        <ul key={myConcerns.join()} className="-mx-5 mt-3 flex snap-x scroll-px-5 lg:scroll-px-0 gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-8 lg:px-0">
          {[...myConcerns, ...CONCERN_KEYS.filter((k) => !myConcerns.includes(k))].map((k) => {
            const on = concern === k;
            return (
              <li key={k} className="shrink-0 snap-start">
                <button
                  onClick={() => setConcern(on ? null : k)}
                  aria-pressed={on}
                  className={`relative flex h-24 w-28 flex-col justify-end rounded-[1.5rem] bg-gradient-to-br p-3 text-left text-[#3a2430] transition lg:w-full ${CONCERN_HUE[k]} ${on ? "ring-2 ring-plum ring-offset-2 ring-offset-blush-50" : "hover:-translate-y-0.5"}`}
                >
                  {myConcerns.includes(k) && <span className="absolute top-2 left-2 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-medium text-[#7a3f5c]">For you</span>}
                  <span className="text-sm font-medium">{CONCERNS[k].label}</span>
                  {latest && <span className="text-[10px] opacity-70">You: {latest.scores[k]}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {filtering ? (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">{results.length} product{results.length === 1 ? "" : "s"}</h2>
            <button
              onClick={() => {
                setQ("");
                setCat("all");
                setConcern(null);
                setFreeOnly(false);
                setUnder25(false);
              }}
              className="text-xs text-plum underline"
            >
              Clear all
            </button>
          </div>
          {results.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {results.map((r, i) => <ProductTile key={r.product.id} row={r} scanned={Boolean(latest)} i={i} />)}
            </ul>
          ) : (
            <p className="mt-4 rounded-3xl border border-dashed border-blush-300 p-8 text-center text-sm text-muted">Nothing matches. Try fewer filters.</p>
          )}
        </section>
      ) : (
        <>
          {!latest && (
            <Link href="/scan" className="mt-8 flex items-center gap-3 rounded-[2rem] bg-gradient-to-r from-blush-100 to-surface p-5 text-sm">
              <Sparkles className="size-5 text-plum" />
              <span className="flex-1">Scan your skin to see what worked for people like you.</span>
              <span className="rounded-full bg-plum-deep px-4 py-2 text-xs text-white">Start scan</span>
            </Link>
          )}
          {shelves.filter((s) => s.items.length).map((s) => (
            <section key={s.id} className="mt-8">
              <h2 className="flex items-center gap-2 text-sm font-medium">{s.icon} {s.title}</h2>
              <ul key={latest?.id ?? "none"} className="-mx-5 mt-3 flex snap-x scroll-px-5 lg:scroll-px-0 gap-4 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
                {s.items.map((r, i) => (
                  <ProductTile key={r.product.id} row={r} scanned={Boolean(latest)} i={i} className="w-44 shrink-0 snap-start lg:w-52" />
                ))}
              </ul>
            </section>
          ))}
          <section className="mt-10">
            <h2 className="text-sm font-medium">Everything</h2>
            <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {rows.map((r, i) => <ProductTile key={r.product.id} row={r} scanned={Boolean(latest)} i={i} />)}
            </ul>
          </section>
        </>
      )}
    </Page>
  );
}

function ProductTile({ row: { product, o, all }, scanned, i, className = "" }: { row: Row; scanned: boolean; i: number; className?: string }) {
  const v = verdictFor(scanned ? o : null, all);
  return (
    <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04, ease: EASE }} className={`relative ${className}`}>
      <Link href={`/product/${product.id}`} className="group block rounded-[2rem] bg-blush-100/70 p-3 pb-5 text-center transition hover:-translate-y-1 hover:bg-blush-100 hover:shadow-soft">
        <div className="relative mx-auto aspect-square w-full">
          <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${product.hue} transition duration-500 group-hover:scale-[1.03]`} />
          <ProductVisual product={product} className="absolute inset-x-0 top-[10%] mx-auto h-[80%] w-[80%] transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-3deg]" />
          <span className={`absolute inset-x-[6%] bottom-[4%] truncate rounded-full px-2.5 py-1 text-center text-[10px] font-medium shadow-card ${VERDICT_STYLE[v.kind].chip}`}>{v.short}</span>
        </div>
        <p className="mt-3 line-clamp-1 px-1 text-sm font-medium">{product.name}</p>
        <p className="text-[11px] text-muted">
          {product.actives[0] ? ACTIVE_LABELS[product.actives[0]] : product.brand} · {product.size}
        </p>
        <p className="mt-1 text-[11px] text-muted">${product.price.toFixed(2)}</p>
      </Link>
      <SaveHeart productId={product.id} className="absolute top-5 right-5" />
    </motion.li>
  );
}
