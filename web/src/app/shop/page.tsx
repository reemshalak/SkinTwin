"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Camera, Check, CircleDot, Droplet, Droplets, Feather, Flame, Leaf, Search, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Tag, Users, Waves, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Page } from "@/components/Page";
import { WriteOn } from "@/components/WriteOn";
import { useT, type TKey } from "@/lib/i18n";
import { ProductVisual } from "@/components/ProductArt";
import { SaveHeart } from "@/components/SaveHeart";
import { SAMPLE_POSTS } from "@/lib/community";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { ACTIVE_LABELS, PRODUCTS } from "@/lib/products";
import { useStore } from "@/lib/store";
import { everyone, findTwins, fitScore, outcomeFor, type Outcome } from "@/lib/twins";
import { TRYON_VERDICT, VERDICT_STYLE, verdictFor } from "@/lib/verdict";
import type { ConcernKey, Product } from "@/lib/types";

const CATEGORIES: { id: string; label: string; match: (p: Product) => boolean }[] = [
  { id: "all", label: "prod.all", match: () => true },
  { id: "treat", label: "prod.treat", match: (p) => ["serum", "treatment", "exfoliant"].includes(p.category) },
  { id: "basics", label: "prod.basics", match: (p) => ["moisturizer", "sunscreen", "cleanser"].includes(p.category) },
  { id: "makeup", label: "prod.makeup", match: (p) => p.category === "makeup" },
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
  const { t } = useT();
  const [cat, setCat] = useState("all");
  const [concern, setConcern] = useState<ConcernKey | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState<Sort>("best");
  const [twinsOnly, setTwinsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState("");
  // Search from the header arrives as ?q=
  useEffect(() => {
    const apply = (term: string | null) => {
      if (term === "Fragrance-free") setFreeOnly(true);
      else if (term) setQ(term);
    };
    apply(new URLSearchParams(window.location.search).get("q"));
    const onSearch = (e: Event) => apply((e as CustomEvent<string>).detail);
    window.addEventListener("skintwin:search", onSearch);
    return () => window.removeEventListener("skintwin:search", onSearch);
  }, []);

  const rows = useMemo<Row[]>(() => {
    const twins = latest ? findTwins(latest.scores, latest.sampleId) : [];
    const all = everyone();
    return PRODUCTS.map((p) => ({ product: p, o: outcomeFor(p.id, twins), all: outcomeFor(p.id, all) })).sort((a, b) =>
      a.o.n >= 5 && b.o.n >= 5 ? fitScore(b.o) - fitScore(a.o) : b.o.n - a.o.n,
    );
  }, [latest]);

  const query = q.trim().toLowerCase();
  const filtering = Boolean(query || concern || freeOnly || maxPrice < MAX_PRICE || twinsOnly || sort !== "best" || cat !== "all");
  const c = CATEGORIES.find((x) => x.id === cat)!;
  const trendRank = (id: string) => {
    const i = TRENDING.indexOf(id);
    return i < 0 ? 999 : i;
  };
  const results = rows.filter(({ product: p, o, all }) => {
    if (!c.match(p)) return false;
    if (concern && !helps(p, concern)) return false;
    if (freeOnly && !fragranceFree(p)) return false;
    if (p.price > maxPrice) return false;
    if (twinsOnly && verdictFor(o, all).kind !== "good") return false;
    if (query) {
      const hay = `${p.name} ${p.brand} ${p.category} ${p.actives.map((a) => ACTIVE_LABELS[a]).join(" ")} ${p.ingredients.join(" ")}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  if (sort === "price-asc") results.sort((a, b) => a.product.price - b.product.price);
  if (sort === "price-desc") results.sort((a, b) => b.product.price - a.product.price);
  if (sort === "rating") results.sort((a, b) => b.all.avgRating - a.all.avgRating);
  if (sort === "trending") results.sort((a, b) => trendRank(a.product.id) - trendRank(b.product.id));
  const clearAll = () => {
    setQ("");
    setCat("all");
    setConcern(null);
    setFreeOnly(false);
    setMaxPrice(MAX_PRICE);
    setTwinsOnly(false);
    setSort("best");
  };

  // Your three lowest scores become the "for you" concern shortcuts.
  const myConcerns = latest ? [...CONCERN_KEYS].sort((a, b) => latest.scores[a] - latest.scores[b]).slice(0, 3) : [];
  const byId = (id: string) => rows.find((r) => r.product.id === id)!;
  const shelves: { id: string; title: string; icon: React.ReactNode; items: Row[] }[] = [
    ...(latest
      ? [
          { id: "twins", title: t("prod.worked"), icon: <Users className="size-4 text-good" />, items: rows.filter((r) => verdictFor(r.o, r.all).kind === "good").slice(0, 8) },
          {
            id: "risky",
            title: t("prod.risky"),
            icon: <Flame className="size-4 text-warn" />,
            items: rows.filter((r) => r.all.avgRating >= 3.6 && verdictFor(r.o, r.all).kind === "risky").slice(0, 8),
          },
        ]
      : []),
    { id: "makeup", title: "Makeup to try on", icon: <Sparkles className="size-4 text-plum" />, items: rows.filter((r) => r.product.category === "makeup") },
    { id: "trending", title: t("prod.trending"), icon: <Flame className="size-4 text-rose" />, items: TRENDING.slice(0, 8).map(byId) },
    { id: "gentle", title: t("prod.gentle"), icon: <Leaf className="size-4 text-good" />, items: rows.filter((r) => fragranceFree(r.product) && !r.product.risks.some((x) => x.concern === "redness")).slice(0, 8) },
    { id: "budget", title: t("prod.budget"), icon: <Tag className="size-4 text-warn" />, items: rows.filter((r) => r.product.price < 25).slice(0, 8) },
  ];

  const chip = (on: boolean) => `shrink-0 rounded-full px-4 py-1.5 text-xs transition ${on ? "bg-plum-deep text-white shadow-card" : "border border-line bg-surface text-muted hover:text-plum"}`;

  return (
    <Page>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">{t("prod.eyebrow")}</p>
      <h1 className="mt-1 font-display text-3xl text-ink lg:text-4xl"><WriteOn text={t("prod.title")} mark={t("prod.mark")} /></h1>


      <label className="relative mt-5 block">
        <Search className="pointer-events-none absolute top-1/2 start-4 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("prod.search")}
          aria-label="Search products"
          className="w-full rounded-full border border-line bg-surface py-3.5 pe-11 ps-11 text-sm shadow-card outline-none transition focus:border-plum"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search" className="absolute top-1/2 end-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-blush-100">
            <X className="size-4" />
          </button>
        )}
      </label>

      {/* Shop by concern: your score on each, weakest first */}
      <section className="mt-6">
        <h2 className="text-sm font-medium">{t("prod.byConcern")}</h2>
        <ul key={myConcerns.join()} className="-mx-5 mt-3 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-8 lg:scroll-px-0 lg:px-0">
          {[...myConcerns, ...CONCERN_KEYS.filter((k) => !myConcerns.includes(k))].map((k) => {
            const on = concern === k;
            const Icon = CONCERN_ICON[k];
            const v = latest?.scores[k];
            return (
              <li key={k} className="shrink-0 snap-start">
                <button
                  onClick={() => setConcern(on ? null : k)}
                  aria-pressed={on}
                  className={`relative flex h-32 w-28 flex-col items-center justify-center gap-1.5 rounded-[1.5rem] bg-gradient-to-br p-3 text-center text-[#3a2430] transition lg:w-full ${CONCERN_HUE[k]} ${on ? "ring-2 ring-plum ring-offset-2 ring-offset-blush-50" : "hover:-translate-y-0.5"}`}
                >
                  {myConcerns.includes(k) && <span className="absolute top-2 start-2 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-medium text-[#7a3f5c]">{t("prod.forYou")}</span>}
                  <ScoreRing value={v}>
                    <Icon className="size-4" />
                  </ScoreRing>
                  <span className="text-sm font-medium leading-tight">{CONCERNS[k].label}</span>
                  {v !== undefined && <span className="text-[10px] opacity-75">{v}/100 · {v < 45 ? "Needs care" : v < 70 ? "OK" : "Great"}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 flex items-center justify-between lg:hidden">
        <button onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} className={chip(showFilters)}>
          <SlidersHorizontal className="me-1.5 inline size-3.5" /> Filters & sort
        </button>
        {filtering && <button onClick={clearAll} className="text-xs text-plum underline">{t("prod.clear")}</button>}
      </div>

      <div className="mt-4 gap-8 lg:mt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className={`${showFilters ? "block" : "hidden"} mb-6 space-y-6 rounded-[2rem] border border-line bg-surface p-5 lg:sticky lg:top-24 lg:block lg:self-start`}>
          <FilterGroup title="Sort by">
            {SORTS.map((s) => (
              <Radio key={s.id} on={sort === s.id} onClick={() => setSort(s.id)} disabled={s.id === "best" && !latest}>{s.label}</Radio>
            ))}
          </FilterGroup>
          <FilterGroup title={`Budget: up to $${maxPrice}${maxPrice >= MAX_PRICE ? "+" : ""}`}>
            <input type="range" min={10} max={MAX_PRICE} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} aria-label="Maximum price" className="w-full accent-[var(--color-plum,#8a3f66)]" />
            <div className="flex justify-between text-[10px] text-muted"><span>$10</span><span>$25</span><span>${MAX_PRICE}+</span></div>
          </FilterGroup>
          <FilterGroup title="For my skin">
            <Toggle on={twinsOnly} onClick={() => setTwinsOnly((v) => !v)} disabled={!latest}><Users className="size-3.5 text-good" /> Worked for my twins</Toggle>
            <Toggle on={freeOnly} onClick={() => setFreeOnly((v) => !v)}><Leaf className="size-3.5 text-good" /> {t("prod.free")}</Toggle>
          </FilterGroup>
          <FilterGroup title="Type">
            {CATEGORIES.map((x) => (
              <Radio key={x.id} on={cat === x.id} onClick={() => setCat(x.id)}>{t(x.label as TKey)}</Radio>
            ))}
          </FilterGroup>
          {filtering && <button onClick={clearAll} className="hidden w-full rounded-full border border-line py-2 text-xs text-plum lg:block">{t("prod.clear")}</button>}
        </aside>

        <div className="min-w-0">
      {filtering ? (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">{t("prod.count", { n: results.length })}</h2>
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
              <h2 className="flex items-center gap-2 text-sm font-medium">
                {s.icon} {s.title}
                {s.id === "makeup" && (
                  <Link href="/mirror" className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-4 py-1.5 text-xs font-medium text-white">
                    <Camera className="size-3.5" /> Open the try-on mirror
                  </Link>
                )}
              </h2>
              <ul key={latest?.id ?? "none"} className="-mx-5 mt-3 flex snap-x scroll-px-5 lg:scroll-px-0 gap-4 overflow-x-auto overflow-y-hidden px-5 pt-1 pb-2 lg:mx-0 lg:px-0">
                {s.items.map((r, i) => (
                  <ProductTile key={r.product.id} row={r} scanned={Boolean(latest)} i={i} className="w-44 shrink-0 snap-start lg:w-52" />
                ))}
              </ul>
            </section>
          ))}
          <section className="mt-10">
            <h2 className="text-sm font-medium">{t("prod.everything")}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {rows.map((r, i) => <ProductTile key={r.product.id} row={r} scanned={Boolean(latest)} i={i} />)}
            </ul>
          </section>
        </>
      )}
        </div>
      </div>
    </Page>
  );
}

const MAX_PRICE = 45;
type Sort = "best" | "trending" | "rating" | "price-asc" | "price-desc";
const SORTS: { id: Sort; label: string }[] = [
  { id: "best", label: "Best for my skin" },
  { id: "trending", label: "Trending" },
  { id: "rating", label: "Highest rated" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];
const CONCERN_ICON: Record<ConcernKey, typeof Droplets> = {
  moisture: Droplets,
  oiliness: Droplet,
  redness: Flame,
  texture: Waves,
  pore: CircleDot,
  acne: ShieldCheck,
  radiance: Sun,
  wrinkle: Feather,
};

// Your score as a ring around the concern's icon.
function ScoreRing({ value, children }: { value?: number; children: React.ReactNode }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const color = value === undefined ? "#7a3f5c" : value < 45 ? "#c2485d" : value < 70 ? "#c98a2e" : "#3f8f6b";
  return (
    <span className="relative grid size-11 place-items-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.8)" strokeWidth="4" />
        {value !== undefined && (
          <motion.circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 0.9, ease: EASE }} />
        )}
      </svg>
      <span className="relative" style={{ color }}>{children}</span>
    </span>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{title}</legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function Radio({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-start text-sm transition disabled:opacity-40 ${on ? "bg-blush-100 text-plum-deep" : "text-ink hover:bg-blush-50"}`}>
      <span className={`grid size-4 place-items-center rounded-full border-2 ${on ? "border-plum" : "border-line"}`}>{on && <span className="size-1.5 rounded-full bg-plum" />}</span>
      {children}
    </button>
  );
}

function Toggle({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-start text-sm transition disabled:opacity-40 ${on ? "bg-blush-100 text-plum-deep" : "text-ink hover:bg-blush-50"}`}>
      <span className={`grid size-4 place-items-center rounded border-2 ${on ? "border-plum bg-plum text-white" : "border-line"}`}>{on && <Check className="size-3" strokeWidth={3} />}</span>
      {children}
    </button>
  );
}

const NEW = new Set(["aura-clarifying-cleanser", "ceramide-labs-cleanser"]);

function ProductTile({ row: { product, o, all }, scanned, i, className = "" }: { row: Row; scanned: boolean; i: number; className?: string }) {
  const v = product.category === "makeup" ? TRYON_VERDICT : verdictFor(scanned ? o : null, all);
  // One badge at most: twins' favourite beats trending beats new.
  const badge = scanned && v.kind === "good" && o.improvedPct >= 85 ? "Twin favourite" : TRENDING.slice(0, 3).includes(product.id) ? "Trending" : NEW.has(product.id) ? "New" : null;
  return (
    <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04, ease: EASE }} className={`relative ${className}`}>
      <Link href={`/product/${product.id}`} className="group block rounded-[2rem] bg-blush-100/70 p-3 pb-5 text-center transition hover:-translate-y-1 hover:bg-blush-100 hover:shadow-soft">
        <div className="relative mx-auto aspect-square w-full">
          <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${product.hue} transition duration-500 group-hover:scale-[1.03]`} />
          <ProductVisual product={product} className="absolute inset-x-0 top-[10%] mx-auto h-[80%] w-[80%] transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-3deg]" />
          <span className={`absolute inset-x-[6%] bottom-[4%] truncate rounded-full px-2.5 py-1 text-center text-[10px] font-medium shadow-card ${VERDICT_STYLE[v.kind].chip}`}>{v.short}</span>
        </div>
        {badge && (
          <span className={`absolute top-5 start-5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-card ${badge === "Twin favourite" ? "bg-plum-deep text-white" : "bg-surface text-plum-deep"}`}>
            {badge}
          </span>
        )}
        <p className="mt-3 line-clamp-1 px-1 text-sm font-medium">{product.name}</p>
        {product.shades && (
          <span className="mt-1.5 flex justify-center gap-1" aria-label={`${product.shades.length} shades`}>
            {product.shades.map((sh) => (
              <span key={sh.name} title={sh.name} className="size-3.5 rounded-full border border-white shadow-sm" style={{ background: sh.hex }} />
            ))}
          </span>
        )}
        <p className="text-[11px] text-muted">
          {product.key} · {product.size}
        </p>
        <p className="mt-1 text-[11px] text-muted">${product.price.toFixed(2)}</p>
      </Link>
      <SaveHeart productId={product.id} className="absolute top-5 end-5" />
    </motion.li>
  );
}
