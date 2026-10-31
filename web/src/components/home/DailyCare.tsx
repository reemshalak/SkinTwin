"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { WindDown } from "../WindDown";
import { Check, Droplet, Moon, Wind } from "lucide-react";
import { celebrateOnce } from "../Celebrate";
import type { Scores } from "@/lib/types";

const GOAL = 6;

// Three small habits, each tied to the score it actually moves.
export function DailyCare({ dayKey, done, toggle, bedtime, scores }: { dayKey: string; done: Record<string, string[]>; toggle: (k: string, id: string) => void; bedtime: string; scores: Scores }) {
  const got = done[dayKey] ?? [];
  const glasses = Array.from({ length: GOAL }, (_, i) => i + 1).filter((n) => got.includes(`water${n}`)).length;
  const setGlasses = (target: number) => {
    for (let k = 1; k <= GOAL; k++) if (k <= target !== got.includes(`water${k}`)) toggle(dayKey, `water${k}`);
    if (target === GOAL) celebrateOnce("water", "Fully hydrated!", "All 6 glasses today. Your skin noticed.", "💧");
  };
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Daily care <span className="font-normal text-muted">· small habits your scans can see</span></h2>
        <Link href="/settings#reminders" className="text-[11px] text-plum">Reminders</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Water glasses={glasses} onSet={setGlasses} score={scores.moisture} />
        <Sleep on={got.includes("sleep")} onToggle={() => toggle(dayKey, "sleep")} bedtime={bedtime} score={scores.radiance} />
        <Breathe on={got.includes("rest")} onDone={() => !got.includes("rest") && toggle(dayKey, "rest")} score={scores.redness} />
      </div>
    </section>
  );
}

function Why({ label, score, href }: { label: string; score: number; href: string }) {
  return (
    <Link href={href} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-2.5 py-1 text-[11px] text-plum-deep hover:bg-surface">
      Moves your <b className="font-medium">{label}</b> · {score}/100
    </Link>
  );
}

function Water({ glasses, onSet, score }: { glasses: number; onSet: (n: number) => void; score: number }) {
  const level = glasses / GOAL;
  return (
    <div className="rounded-[2rem] border border-line bg-gradient-to-br from-surface to-blush-100 p-5 text-ink">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">Hydration</p>
          <p className="font-display text-3xl">{glasses}<span className="text-lg opacity-60">/{GOAL} glasses</span></p>
        </div>
        {/* A glass that fills with a gentle wave */}
        <button onClick={() => onSet(Math.min(GOAL, glasses + 1))} aria-label="Add a glass of water" className="relative h-20 w-14 overflow-hidden rounded-b-2xl rounded-t-md border-2 border-white/90 bg-white/40">
          <motion.span className="absolute inset-x-0 bottom-0 bg-rose/70" animate={{ height: `${level * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
            <motion.svg viewBox="0 0 60 8" className="absolute -top-1.5 left-0 h-2 w-[200%] text-rose/70" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }} aria-hidden>
              <path d="M0 4 Q7.5 0 15 4 T30 4 T45 4 T60 4 V8 H0Z" fill="currentColor" />
            </motion.svg>
          </motion.span>
          <Droplet className="absolute inset-0 m-auto size-4 text-white" />
        </button>
      </div>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: GOAL }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => onSet(n === glasses ? n - 1 : n)} aria-label={`${n} glasses`} className={`h-2 flex-1 rounded-full transition ${n <= glasses ? "bg-rose/70" : "bg-white/70"}`} />
        ))}
      </div>
      <p className="mt-3 text-xs opacity-80">Log each glass you drink. After a few weeks your journal shows if water days match better hydration scores.</p>
      <Why label="Hydration" score={score} href="/report/moisture" />
    </div>
  );
}

function Sleep({ on, onToggle, bedtime, score }: { on: boolean; onToggle: () => void; bedtime: string; score: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-[2rem] glow-card p-5 text-white">
      {/* Stars appear once you've done it */}
      {[...Array(9)].map((_, i) => (
        <motion.span key={i} aria-hidden className="absolute size-1 rounded-full bg-white" style={{ left: `${(i * 37) % 95}%`, top: `${(i * 23) % 70}%` }} animate={on ? { opacity: [0.2, 1, 0.4], scale: [0.6, 1.2, 0.8] } : { opacity: 0.12 }} transition={{ duration: 2, repeat: on ? Infinity : 0, delay: i * 0.2 }} />
      ))}
      <div className="relative">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">Repair sleep</p>
        <p className="font-display text-3xl">In bed by {bedtime}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-plum-deep hover:bg-blush-50">
            <Moon className="size-4" /> {on ? "Wind down again" : "Wind down"}
          </button>
          {!on && <button onClick={onToggle} className="rounded-full bg-white/15 px-4 py-2 text-xs hover:bg-white/25">I&apos;m already in bed</button>}
          {on && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-xs"><Check className="size-3.5" /> Done tonight</span>}
        </div>
        <AnimatePresence>{open && <WindDown onClose={() => setOpen(false)} onDone={() => !on && onToggle()} />}</AnimatePresence>
        <p className="mt-3 text-xs opacity-80">Skin does most of its repair while you sleep. Short nights show up as dullness.</p>
        <Link href="/report/radiance" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] hover:bg-white/25">
          Moves your <b className="font-medium">Glow</b> · {score}/100
        </Link>
      </div>
    </div>
  );
}

function Breathe({ on, score }: { on: boolean; onDone: () => void; score: number }) {
  return (
    <div className="rounded-[2rem] border border-line bg-gradient-to-br from-blush-50 to-blush-200/60 p-5 text-ink">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Calm minute</p>
          <p className="font-display text-3xl">{on ? "Done today" : "Breathe with me"}</p>
        </div>
        <Link href="/journal?calm" aria-label="Open the calm minute" className="relative grid size-20 shrink-0 place-items-center">
          <motion.span className="absolute inset-0 rounded-full bg-plum/20" animate={{ scale: [0.8, 1, 0.8] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
          <span className="relative grid size-12 place-items-center rounded-full bg-plum text-white">{on ? <Check className="size-5" /> : <Wind className="size-5" />}</span>
        </Link>
      </div>
      <p className="mt-3 text-xs text-muted">One minute of box breathing with soft music, in your journal. Stress shows up as oil and redness.</p>
      <Link href="/report/redness" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-2.5 py-1 text-[11px] text-plum-deep hover:bg-surface">
        Moves your <b className="font-medium">Calmness</b> · {score}/100
      </Link>
    </div>
  );
}
