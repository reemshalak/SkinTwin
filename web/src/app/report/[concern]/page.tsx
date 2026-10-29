"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { CountUp, GrowBar, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { ConfidenceBadge, Delta, ProductThumb } from "@/components/ui";
import { CONCERN_KEYS, CONCERNS, scoreTone } from "@/lib/concerns";
import { PRODUCTS } from "@/lib/products";
import { sampleById } from "@/lib/samples";
import { useStore } from "@/lib/store";
import { outcomeFor } from "@/lib/twins";
import type { ConcernKey } from "@/lib/types";
import { useTwins } from "@/lib/use-twins";
import { patchStyle, ZONES } from "@/lib/zones";

const ADVICE: Record<ConcernKey, { what: string; tips: string[] }> = {
  moisture: { what: "How much water your skin holds. Low hydration shows as tightness, flaking and fine dehydration lines.", tips: ["Apply humectants (hyaluronic acid, glycerin) to damp skin", "Seal with a moisturiser", "Skip hot water and harsh foaming cleansers"] },
  oiliness: { what: "How much sebum sits on the surface. A low score means shine by midday and a higher chance of clogged pores.", tips: ["Use a gentle, non-stripping cleanser", "Niacinamide can help balance oil", "Choose lightweight, non-comedogenic textures"] },
  redness: { what: "Visible flushing and irritation. A low score suggests reactive skin that does best with fewer, gentler products.", tips: ["Introduce one new product at a time", "Look for ceramides and soothing ingredients", "Daily mineral SPF helps calm sun-triggered redness"] },
  texture: { what: "How smooth the surface is. Bumps, flakes and rough patches lower it.", tips: ["Exfoliate gently once or twice a week", "Retinoids smooth texture over months", "Never combine strong acids with retinoids in one night"] },
  pore: { what: "How visible your pores are, mostly on the nose and inner cheeks.", tips: ["BHA (salicylic acid) clears inside pores", "Keep oil balanced through the day", "Pore size is partly genetic: aim for clearer, not smaller"] },
  acne: { what: "Active blemishes right now. A low score means breakouts are present.", tips: ["Spot-treat instead of over-drying the whole face", "Don't pick: it leaves marks", "Persistent or painful acne is worth a dermatologist visit"] },
  radiance: { what: "How much light your skin reflects. Dullness and uneven tone lower it.", tips: ["Vitamin C in the morning, under SPF", "Gentle exfoliation lifts dull surface cells", "Hydrated skin reflects more light"] },
  wrinkle: { what: "Fine lines and wrinkles, mostly around the eyes and forehead.", tips: ["Daily SPF is the most proven prevention", "Retinoids are the best-studied topical", "Hydration plumps fine lines short-term"] },
};

export default function ConcernPage() {
  const { concern } = useParams<{ concern: ConcernKey }>();
  const { latest, ready } = useStore();
  const { twins } = useTwins();
  const valid = CONCERN_KEYS.includes(concern);

  const data = useMemo(() => {
    if (!valid || !twins.length) return null;
    const twinAvg = Math.round(twins.reduce((s, t) => s + t.member.scores[concern], 0) / twins.length);
    const helpers = PRODUCTS.filter((p) => p.category !== "makeup")
      .map((p) => ({ product: p, o: outcomeFor(p.id, twins) }))
      .filter(({ o }) => o.n >= 5 && (o.avgDelta[concern] ?? 0) > 0.5)
      .sort((a, b) => (b.o.avgDelta[concern] ?? 0) - (a.o.avgDelta[concern] ?? 0))
      .slice(0, 3);
    return { twinAvg, helpers };
  }, [valid, twins, concern]);

  if (!ready) return null;
  if (!latest) return <NeedScan what="this measurement" />;
  if (!valid) return <NeedScan what="that measurement" />;

  const photo = latest.photo ?? (latest.sampleId ? sampleById(latest.sampleId)?.image : undefined);
  const score = latest.display[concern];
  const tone = scoreTone(latest.scores[concern]);
  const idx = CONCERN_KEYS.indexOf(concern);
  const next = CONCERN_KEYS[(idx + 1) % CONCERN_KEYS.length];
  const prev = CONCERN_KEYS[(idx + CONCERN_KEYS.length - 1) % CONCERN_KEYS.length];

  return (
    <Page>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/analysis" className="inline-flex items-center gap-1 text-sm text-plum">
          <ChevronLeft className="size-4" /> Skin map
        </Link>
        <div className="flex gap-2 text-sm">
          <Link href={`/report/${prev}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-muted hover:text-plum">
            ← {CONCERNS[prev].label}
          </Link>
          <Link href={`/report/${next}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-muted hover:text-plum">
            {CONCERNS[next].label} →
          </Link>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-ink shadow-soft">
            {photo ? (
              <div className="aspect-square w-full" style={patchStyle(photo, concern, 3)} role="img" aria-label={`Close-up of your ${ZONES[concern].area.toLowerCase()}`} />
            ) : (
              <div className="aspect-square w-full bg-gradient-to-br from-blush-200 to-plum" />
            )}
            <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 text-xs text-plum">
              <MapPin className="size-3" /> {ZONES[concern].area}
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-6 pt-16 text-white">
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">{CONCERNS[concern].label}</p>
              <p className="font-display text-6xl font-light">
                <CountUp value={score} />
                <span className="text-xl opacity-70">/100</span>
              </p>
              <p className="font-display text-lg italic">{tone === "low" ? CONCERNS[concern].low : tone === "good" ? CONCERNS[concern].high : "Balanced"}</p>
            </div>
          </div>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.05}>
            <h1 className="font-display text-3xl lg:text-4xl">{CONCERNS[concern].label}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted lg:text-base">{ADVICE[concern].what}</p>
          </Reveal>

          {data && (
            <Reveal delay={0.1} className="rounded-[2rem] border border-line bg-surface p-6">
              <h2 className="text-sm font-medium">You vs your {twins.length} twins</h2>
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <div className="mb-1 flex justify-between"><span>You</span><span className="tabular-nums">{latest.scores[concern]}</span></div>
                  <div className="h-2 rounded-full bg-blush-100"><GrowBar value={latest.scores[concern]} className="h-full rounded-full bg-plum" /></div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between"><span>Twin average</span><span className="tabular-nums">{data.twinAvg}</span></div>
                  <div className="h-2 rounded-full bg-blush-100"><GrowBar value={data.twinAvg} delay={0.15} className="h-full rounded-full bg-blush-400" /></div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted">Raw YouCam score, higher is healthier.</p>
            </Reveal>
          )}

          {data && data.helpers.length > 0 && (
            <section>
              <h2 className="text-sm font-medium">What improved {CONCERNS[concern].label.toLowerCase()} for your twins</h2>
              <Stagger className="mt-3 space-y-3">
                {data.helpers.map(({ product, o }) => (
                  <StaggerItem key={product.id}>
                    <Link href={`/product/${product.id}`} className="group flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-card">
                      <ProductThumb product={product} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span>
                            {CONCERNS[concern].label} <Delta value={o.avgDelta[concern] ?? 0} />
                          </span>
                          <ConfidenceBadge level={o.confidence} n={o.n} />
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted transition group-hover:translate-x-1" />
                    </Link>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          <Reveal delay={0.15} className="rounded-[2rem] bg-blush-100 p-6">
            <h2 className="text-sm font-medium">Good habits</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
              {ADVICE[concern].tips.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted">Cosmetic guidance, not a diagnosis.</p>
          </Reveal>
        </div>
      </div>
    </Page>
  );
}
