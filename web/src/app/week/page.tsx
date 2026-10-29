"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Flame, Pause, Repeat, Sparkles, Timer, TrendingDown, TrendingUp, Users } from "lucide-react";
import { GoalCard } from "@/components/GoalCard";
import { EASE } from "@/components/motion";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { ProductThumb } from "@/components/ui";
import { CONCERNS } from "@/lib/concerns";
import { productById } from "@/lib/products";
import { sampleById } from "@/lib/samples";
import { useStore } from "@/lib/store";
import type { RoutineItem, SkinProfile } from "@/lib/types";
import { useTwins } from "@/lib/use-twins";
import { productCalls, streak, twinPace, weekMoves, type Call } from "@/lib/week";

const DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const photoOf = (s: SkinProfile) => s.photo ?? (s.sampleId ? sampleById(s.sampleId)?.image : undefined);

const CALL: Record<Call, { label: string; cls: string; icon: typeof Check }> = {
  working: { label: "Keep · it's working", cls: "bg-good-soft text-good", icon: Sparkles },
  keep: { label: "Keep going", cls: "bg-blush-100 text-plum", icon: Check },
  early: { label: "Too early", cls: "bg-blush-100 text-muted", icon: Timer },
  pause: { label: "Pause it", cls: "bg-bad-soft text-bad", icon: Pause },
  swap: { label: "Try a swap", cls: "bg-warn-soft text-warn", icon: Repeat },
};

export default function WeekPage() {
  const { ready, scans, routine, removeFromRoutine } = useStore();
  const { twins } = useTwins();
  const [reveal, setReveal] = useState(false);
  const [paused, setPaused] = useState<string[]>([]);
  // Calls use the plan as it was when you opened the page, so pausing doesn't reshuffle it.
  const [plan, setPlan] = useState<RoutineItem[] | null>(null);
  useEffect(() => {
    if (ready && !plan) setPlan(routine);
  }, [ready, plan, routine]);

  const data = useMemo(() => {
    if (scans.length < 2) return null;
    const prev = scans[scans.length - 2];
    const cur = scans[scans.length - 1];
    return {
      prev,
      cur,
      moves: weekMoves(prev, cur, plan ?? routine),
      calls: productCalls(plan ?? routine, scans, twins),
      pace: twinPace(scans, twins),
      streak: streak(scans),
    };
  }, [scans, routine, plan, twins]);

  if (!ready) return null;
  if (!scans.length) return <NeedScan what="your weekly check-in" />;
  if (!data) {
    return (
      <Page className="!max-w-xl text-center">
        <p className="font-display text-3xl">Your first week starts now</p>
        <p className="mt-2 text-sm text-muted">Check in again in 7 days, same light, same spot. That&apos;s when this page shows what changed.</p>
        <Link href="/routine" className="mt-6 inline-block rounded-full bg-plum-deep px-6 py-3 text-sm text-white">Go to my plan</Link>
      </Page>
    );
  }

  const { prev, cur, moves, calls, pace, streak: st } = data;
  const top = moves[0];
  const overall = cur.overall - prev.overall;
  const weekNo = scans.length - 1;

  return (
    <Page className="!max-w-4xl">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">Week {weekNo} check-in · {DATE.format(new Date(cur.capturedAt))}</p>

      {/* Headline */}
      <section className="glow-card mt-3 overflow-hidden rounded-[2rem] p-6 text-white shadow-soft">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex gap-2">
            {[prev, cur].map((s, i) => {
              const photo = photoOf(s);
              return (
                <button key={s.id} onClick={() => setReveal((v) => !v)} className="relative size-24 overflow-hidden rounded-2xl bg-white/15 sm:size-28" aria-label={reveal ? "Hide photos" : "Show photos"}>
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className={`h-full w-full object-cover transition duration-500 ${reveal ? "" : "scale-110 blur-lg"}`} />
                  )}
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] backdrop-blur">{i ? "This week" : "Last week"}</span>
                </button>
              );
            })}
          </div>
          <div className="min-w-0 flex-1">
            {top && top.d > 0 ? (
              <p className="font-display text-4xl leading-tight">
                {CONCERNS[top.k].label} +{top.d}
              </p>
            ) : (
              <p className="font-display text-3xl leading-tight">A steady week</p>
            )}
            <p className="mt-1 text-sm opacity-90">
              {top?.by && top.d > 0 ? `Likely from your ${productById(top.by)?.name}. ` : ""}
              Overall {overall >= 0 ? "+" : ""}
              {overall} · {prev.overall} → {cur.overall}
            </p>
          </div>
          <button onClick={() => setReveal((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur">
            {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />} {reveal ? "Hide" : "Show"} photos
          </button>
        </div>

        <ul className="mt-5 flex flex-wrap gap-2">
          {moves.slice(0, 6).map((m, i) => (
            <motion.li key={m.k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur">
              {m.d > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {CONCERNS[m.k].label} {m.d > 0 ? "+" : ""}
              {m.d}
            </motion.li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Twin pace */}
        {pace && (
          <section className="rounded-[2rem] border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium"><Users className="size-4 text-plum" /> Your pace vs your twins</h2>
            <p className="mt-2 font-display text-3xl text-ink">
              Ahead of <span className="text-plum">{pace.ahead}%</span>
            </p>
            <p className="text-xs text-muted">of {pace.n} twins at week {pace.weeks}, by measured change ({pace.mine >= 0 ? "+" : ""}{pace.mine} points)</p>
            <div className="relative mt-4 h-3 rounded-full bg-gradient-to-r from-blush-100 via-blush-200 to-blush-400">
              <motion.span
                className="absolute top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-surface bg-plum-deep shadow-card"
                initial={{ left: "0%" }}
                animate={{ left: `${Math.min(97, Math.max(3, pace.ahead))}%` }}
                transition={{ duration: 0.9, ease: EASE }}
              />
            </div>
            <p className="mt-2 flex justify-between text-[10px] text-muted"><span>Slower</span><span>Faster</span></p>
          </section>
        )}

        {/* Streak */}
        <section className="rounded-[2rem] border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium"><Flame className="size-4 text-rose" /> Check-in streak</h2>
          <p className="mt-2 font-display text-3xl text-ink">{st.n} week{st.n === 1 ? "" : "s"}</p>
          <div className="mt-4 flex gap-2">
            {st.dots.map((on, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", bounce: 0.5 }}
                className={`grid size-8 place-items-center rounded-full ${on ? "bg-gradient-to-br from-rose to-plum text-white" : "bg-blush-100 text-blush-300"}`}
              >
                <Flame className="size-3.5" />
              </motion.span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Next check-in {DATE.format(new Date(new Date(cur.capturedAt).getTime() + 7 * 86_400_000))}. Same light, same spot.</p>
        </section>
      </div>

      {/* Product calls */}
      {calls.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Your products this week</h2>
          <p className="text-xs text-muted">Called from your own before and after scans.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {calls.map((c, i) => {
              const p = productById(c.productId)!;
              const v = CALL[c.call];
              const swap = c.swapFor ? productById(c.swapFor) : undefined;
              const gone = paused.includes(p.id);
              return (
                <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: gone ? 0.5 : 1, y: 0 }} transition={{ delay: i * 0.06, ease: EASE }} className="rounded-[1.75rem] border border-line bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <ProductThumb product={p} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{p.name}</p>
                      <p className="text-[11px] text-muted">{c.weeks} week{c.weeks === 1 ? "" : "s"} in</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${v.cls}`}>
                      <v.icon className="size-3.5" /> {v.label}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted">{c.reason}</p>
                  {c.call === "pause" && !gone && (
                    <button
                      onClick={() => {
                        routine.filter((r) => r.productId === p.id).forEach((r) => removeFromRoutine(p.id, r.slot));
                        setPaused((x) => [...x, p.id]);
                      }}
                      className="mt-3 rounded-full bg-bad px-4 py-2 text-xs text-white"
                    >
                      Take it out of my plan
                    </button>
                  )}
                  {gone && <p className="mt-3 text-xs text-good">Removed. Add it back from Discover any time.</p>}
                  {c.call === "swap" && swap && (
                    <Link href={`/product/${swap.id}`} className="mt-3 flex items-center gap-2 rounded-2xl bg-blush-50 p-2 text-xs hover:bg-blush-100">
                      <ProductThumb product={swap} size="sm" />
                      <span className="flex-1">Worked better for your twins: <b className="font-medium">{swap.name}</b></span>
                      <ArrowRight className="size-4 text-plum" />
                    </Link>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <GoalCard />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/journal" className="rounded-full border border-line bg-surface px-5 py-3 text-sm text-plum">Open journal</Link>
        <Link href="/share" className="rounded-full bg-plum-deep px-5 py-3 text-sm text-white">Share how it&apos;s going</Link>
      </div>
    </Page>
  );
}
