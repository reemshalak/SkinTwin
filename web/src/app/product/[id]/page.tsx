"use client";

import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, ExternalLink, HelpCircle, MapPin, Moon, Search, Sparkles, Sun, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ProductVisual, productColors } from "@/components/ProductArt";
import { CountUp, EASE } from "@/components/motion";
import { Page, PageTitle } from "@/components/Page";
import { SaveHeart } from "@/components/SaveHeart";
import { ProductReviews } from "@/components/ProductReviews";
import { TryOn } from "@/components/TryOn";
import { ConfidenceBadge, Delta, DemoNote, Stars } from "@/components/ui";
import { CONCERNS } from "@/lib/concerns";
import { conflictsIfAdded } from "@/lib/conflicts";
import { ACTIVE_LABELS, productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { TRYON_VERDICT, VERDICT_STYLE, verdictFor } from "@/lib/verdict";
import { useT, type TKey } from "@/lib/i18n";
import { everyone, findTwins, outcomeFor } from "@/lib/twins";
import type { ConcernKey, Product } from "@/lib/types";

const VIEWS = ["Packshot", "Texture", "Key ingredient"] as const;

function Gallery({ product }: { product: Product }) {
  const [i, setI] = useState(0);
  const { deep } = productColors(product);
  const views = [
    <ProductVisual key="p" product={product} className="absolute top-[44%] left-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2" />,
    <div
      key="t"
      className="absolute top-[44%] left-1/2 aspect-square h-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-inner"
      style={{ background: `radial-gradient(circle at 35% 30%, #ffffff 0 8%, ${deep}cc 30%, ${deep} 70%)` }}
      aria-label="Product texture"
      role="img"
    />,
    <div key="k" className="absolute top-[44%] left-1/2 grid aspect-square h-[56%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface/85 text-center shadow-card">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Hero active</p>
        <p className="mt-1 font-display text-2xl text-plum-deep">{product.key}</p>
      </div>
    </div>,
  ];
  return (
    <div>
      <div className={`relative grid aspect-[5/4] place-items-center overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${product.hue}`}>
        <div className="absolute size-[78%] rounded-full bg-white/35 blur-2xl" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.94, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {views[i]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="relative z-20 -mt-8 flex justify-center gap-3">
        {VIEWS.map((v, j) => (
          <button
            key={v}
            onClick={() => setI(j)}
            aria-label={`Show ${v.toLowerCase()}`}
            aria-pressed={i === j}
            className={`grid size-14 place-items-center overflow-hidden rounded-full border-4 bg-gradient-to-br ${product.hue} shadow-card transition ${
              i === j ? "border-plum-deep" : "border-white hover:scale-105"
            }`}
          >
            {j === 0 ? <ProductVisual product={product} className="h-10 w-10" /> : j === 1 ? <span className="size-7 rounded-full" style={{ background: deep }} /> : <Sparkles className="size-5 text-plum-deep" />}
          </button>
        ))}
      </div>
    </div>
  );
}


export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const product = productById(id);
  const { latest, routine, addToRoutine } = useStore();
  const { t } = useT();
  const [view, setView] = useState<"twins" | "all">("twins");
  const [slot, setSlot] = useState<"am" | "pm">(product?.slot === "am" ? "am" : "pm");

  const outcomes = useMemo(() => {
    if (!product) return null;
    const twins = latest ? findTwins(latest.scores, latest.sampleId) : [];
    return { twins: outcomeFor(product.id, twins), all: outcomeFor(product.id, everyone()) };
  }, [product, latest]);

  if (!product || !outcomes) {
    return (
      <Page>
        <PageTitle title="Product not found" back={{ href: "/shop", label: "Products" }} />
      </Page>
    );
  }

  const verdict = product.category === "makeup" ? TRYON_VERDICT : verdictFor(latest ? outcomes.twins : null, outcomes.all);
  const vs = VERDICT_STYLE[verdict.kind];
  const VIcon = verdict.kind === "good" ? BadgeCheck : verdict.kind === "risky" ? AlertTriangle : verdict.kind === "mixed" ? Users : HelpCircle;
  // Under 5 twins, the numbers below show everyone's results instead.
  const hasTwins = Boolean(latest) && outcomes.twins.n >= 5;
  const o = view === "twins" && hasTwins ? outcomes.twins : outcomes.all;
  const conflicts = conflictsIfAdded(routine, product.id, slot);
  const inRoutine = routine.some((r) => r.productId === product.id && r.slot === slot);
  const deltas = Object.entries(o.avgDelta) as [ConcernKey, number][];
  const maxAbs = Math.max(4, ...deltas.map(([, v]) => Math.abs(v)));

  return (
    <Page>
      <BackLink href="/shop" className="mb-6 inline-flex items-center gap-1 text-sm text-plum">{t("prod.back")}</BackLink>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="self-start lg:sticky lg:top-24">
        <Gallery product={product} />

        <section className="relative z-10 -mt-7 rounded-[2rem] border border-line bg-surface p-6 pt-11 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl leading-tight lg:text-3xl">{product.name}</h1>
              <p className="mt-1 text-xs text-muted">
                {product.brand} · {product.key} · {product.size}
              </p>
            </div>
            <div className="shrink-0 text-end">
              <Stars value={outcomes.all.avgRating} />
              <p className="text-[10px] text-muted">({outcomes.all.n} reviews)</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{product.blurb}</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted">{t("prod.price")} <span className="font-medium text-ink">${product.price.toFixed(2)}</span></p>
            <SaveHeart productId={product.id} className="size-11" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["am", "pm"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                aria-pressed={slot === s}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-xs ${slot === s ? "border-plum bg-blush-100 text-plum" : "border-line text-muted"}`}
              >
                {s === "am" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                {s === "am" ? t("prod.am") : t("prod.pm")}
              </button>
            ))}
          </div>
          {conflicts.map((c, i) => (
            <p key={i} className={`mt-3 flex gap-2 rounded-2xl p-3 text-xs ${c.level === "avoid" ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"}`}>
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <b className="font-medium">Clashes with {productById(c.products.find((p) => p !== product.id)!)?.name}.</b> {c.why} {c.fix}
              </span>
            </p>
          ))}
          <button
            onClick={() => addToRoutine(product.id, slot)}
            disabled={inRoutine}
            className="mt-3 w-full rounded-full bg-plum-deep py-4 text-sm font-medium text-white shadow-soft transition hover:bg-plum disabled:bg-blush-300"
          >
            {inRoutine ? t("prod.added") : conflicts.length ? t("prod.addAnyway") : t("prod.add")}
          </button>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-medium">{t("prod.where")}</p>
            <p className="text-[11px] text-muted">{t("prod.whereSub")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(`${product.brand} ${product.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-full border border-line py-3 text-xs text-plum hover:border-plum"
              >
                <Search className="size-3.5" /> {t("prod.compare")} <ExternalLink className="size-3" />
              </a>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(`${product.category === "makeup" ? "beauty store" : "pharmacy skincare"} near me`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-full border border-line py-3 text-xs text-plum hover:border-plum"
              >
                <MapPin className="size-3.5" /> {t("prod.stores")} <ExternalLink className="size-3" />
              </a>
            </div>
            <a href="#reviews" className="mt-2 block text-center text-[11px] text-plum underline">{t("prod.reviewerLinks")}</a>
          </div>
        </section>

        {product.shades && <TryOn product={product} />}
      </div>

      <div>
        <section className={`mb-5 flex items-start gap-3 rounded-[2rem] border p-5 ${vs.banner}`}>
          <VIcon className="mt-0.5 size-6 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl leading-tight">{t(`v.${verdict.kind}` as TKey)}</p>
            <p className="mt-1 text-sm opacity-90">{verdict.detail}</p>
            {latest && outcomes.twins.n > 0 && (
              <div className="mt-2">
                <ConfidenceBadge level={outcomes.twins.confidence} n={outcomes.twins.n} />
              </div>
            )}
          </div>
          {verdict.kind === "noscan" && (
            <Link href="/scan" className="shrink-0 rounded-full bg-plum-deep px-4 py-2 text-xs text-white">Scan</Link>
          )}
        </section>

        <section className="rounded-[2rem] border border-line bg-surface p-5">
          <div role="tablist" aria-label="Whose results" className="grid grid-cols-2 rounded-full bg-blush-100 p-1 text-xs">
            {(["twins", "all"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                disabled={v === "twins" && !hasTwins}
                className={`relative rounded-full py-2 font-medium transition disabled:opacity-40 ${view === v ? "text-plum" : "text-muted"}`}
              >
                {view === v && (
                  <motion.span layoutId="whose-results" className="absolute inset-0 rounded-full bg-surface shadow-card" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                )}
                <span className="relative">{v === "twins" ? t("prod.yourTwins") : t("prod.everyone")}</span>
              </button>
            ))}
          </div>
          {!latest && (
            <p className="mt-3 text-center text-xs text-muted">
              <Link href="/scan" className="text-plum underline">Scan your skin</Link> to see results from people like you.
            </p>
          )}

          {o.confidence === "none" ? (
            <p className="mt-4 text-center text-sm text-muted">
              Not enough {view === "twins" ? "twins" : "people"} have tried this yet ({o.n}). We won&apos;t guess.
            </p>
          ) : (
            <>
              <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-good-soft p-3">
                  <p className="text-xl font-medium text-good"><CountUp value={o.improvedPct} duration={0.6} />%</p>
                  <p className="text-[10px] text-muted">saw improvement</p>
                </div>
                <div className="rounded-2xl bg-bad-soft p-3">
                  <p className="text-xl font-medium text-bad"><CountUp value={o.worsenedPct} duration={0.6} />%</p>
                  <p className="text-[10px] text-muted">got worse</p>
                </div>
                <div className="rounded-2xl bg-blush-100 p-3">
                  <p className="text-xl font-medium">{o.avgRating}</p>
                  <p className="text-[10px] text-muted">avg stars</p>
                </div>
              </div>
              <div className="mt-3 flex justify-center">
                <ConfidenceBadge level={o.confidence} n={o.n} />
              </div>

              <h3 className="mt-5 text-xs font-medium">Average measured change</h3>
              <ul className="mt-2 space-y-2">
                {deltas.map(([k, v]) => (
                  <li key={k} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-xs">
                    <span>{CONCERNS[k].label}</span>
                    <div className="relative h-2 rounded-full bg-blush-100">
                      <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
                      <motion.span
                        className={`absolute inset-y-0 rounded-full ${v >= 0 ? "left-1/2 bg-good" : "right-1/2 bg-bad"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.abs(v) / maxAbs) * 50}%` }}
                        transition={{ duration: 0.7, ease: EASE }}
                      />
                    </div>
                    <span className="text-end"><Delta value={v} /></span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-muted">Points on the YouCam raw score, before vs. after use.</p>
              </motion.div>
            </>
          )}
        </section>

        <ProductReviews productId={product.id} trials={o.trials} twinsOnly={view === "twins" && hasTwins} />


        <section className="mt-5 rounded-3xl border border-line bg-surface p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-plum" /> Key ingredients
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.actives.map((a) => (
              <span key={a} className="rounded-full bg-blush-100 px-2.5 py-1 text-[11px] text-plum">{ACTIVE_LABELS[a]}</span>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">{product.ingredients.join(", ")}</p>
          {product.risks.length > 0 && (
            <ul className="mt-3 space-y-1 text-[11px] text-warn">
              {product.risks.map((r) => (
                <li key={r.reason}>• {r.reason}</li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-4 mb-2">
          <DemoNote>Demo catalogue with fictional brands and realistic ingredient lists. Twin outcomes are sample data.</DemoNote>
        </div>
      </div>
      </div>
    </Page>
  );
}
