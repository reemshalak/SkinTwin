"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, CircleDot, Droplet, Droplets, Feather, Flame, ShieldCheck, Sun, Waves } from "lucide-react";
import { FaceDiagram } from "../report/Visuals";
import { CONCERN_KEYS, CONCERNS, skinTypeLabel } from "@/lib/concerns";
import type { ConcernKey, SkinProfile } from "@/lib/types";

const ICON: Record<ConcernKey, typeof Sun> = { moisture: Droplets, oiliness: Droplet, redness: Flame, texture: Waves, pore: CircleDot, acne: ShieldCheck, radiance: Sun, wrinkle: Feather };
const word = (v: number) => (v < 45 ? "needs care" : v < 70 ? "okay" : "great");

// Your skin at a glance: tap any of the 8 scores to see what it means.
export function SkinCard({ latest, prev }: { latest: SkinProfile; prev?: SkinProfile }) {
  const weakest = [...CONCERN_KEYS].sort((a, b) => latest.scores[a] - latest.scores[b]);
  const [pick, setPick] = useState<ConcernKey>(weakest[0]);
  const v = latest.scores[pick];
  const d = prev ? v - prev.scores[pick] : null;
  return (
    <div data-tour="skin" className="glow-card rounded-[2rem] p-5 text-white shadow-soft">
      <div className="flex items-center gap-5">
        <Link href="/analysis" aria-label="Open my skin map" className="h-32 w-28 shrink-0 rounded-2xl bg-white/90 p-1 text-ink transition hover:scale-[1.03]">
          <FaceDiagram scores={latest.scores} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/80">My skin</p>
          <p className="font-display text-4xl">
            {latest.overall}
            <span className="text-lg text-white/70">/100</span>
            {latest.source !== "live" && <span className="ms-2 rounded-full bg-white/15 px-2 py-0.5 align-middle font-sans text-[10px] uppercase tracking-wider text-white/85">{latest.sampleId ? "Sample" : "Demo"}</span>}
          </p>
          <p className="text-xs text-white/85">{skinTypeLabel(latest.scores)}</p>
          <AnimatePresence mode="wait">
            <motion.div key={pick} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-2 rounded-2xl bg-white/12 p-2.5 backdrop-blur-sm">
              <p className="text-sm">
                <b className="font-medium">{CONCERNS[pick].label}</b> {v}/100 · {word(v)}
                {d !== null && Math.abs(d) >= 1 && <span className={d > 0 ? "text-[#c9f2d9]" : "text-[#ffd0d6]"}> · {Math.abs(d)} {d > 0 ? "better" : "worse"} this week</span>}
              </p>
              <Link href={`/report/${pick}`} className="mt-1 inline-flex items-center gap-1 text-xs text-white/90 hover:underline">
                What helps {CONCERNS[pick].label.toLowerCase()} <ArrowRight className="size-3 rtl:rotate-180" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* Tap a score */}
      <div className="mt-4 grid grid-cols-8 gap-1.5">
        {CONCERN_KEYS.map((k) => {
          const Icon = ICON[k];
          const s = latest.scores[k];
          const on = k === pick;
          return (
            <button key={k} onClick={() => setPick(k)} aria-pressed={on} aria-label={`${CONCERNS[k].label} ${s}`} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 transition ${on ? "bg-white/25" : "hover:bg-white/10"}`}>
              <span className="relative grid size-8 place-items-center">
                <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                  <motion.circle cx="16" cy="16" r="13" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray={81.7} initial={{ strokeDashoffset: 81.7 }} animate={{ strokeDashoffset: 81.7 * (1 - s / 100) }} transition={{ duration: 0.9 }} />
                </svg>
                <Icon className="size-3.5" />
              </span>
              <span className="text-[10px] tabular-nums text-white/85">{s}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
