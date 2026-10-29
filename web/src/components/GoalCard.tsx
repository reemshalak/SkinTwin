"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Minus, PartyPopper, Plus, Target, X } from "lucide-react";
import { EASE } from "./motion";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { useStore } from "@/lib/store";
import type { ConcernKey } from "@/lib/types";

const WEEKS = [4, 8, 12];
const DAY = 86_400_000;

// A before/after aim for one concern, filled in by weekly check-ins.
export function GoalCard() {
  const { latest, scans, goal, setGoal } = useStore();
  const [editing, setEditing] = useState(false);
  if (!latest) return null;
  if (!goal || editing) return <GoalForm onDone={() => setEditing(false)} />;

  const now = latest.scores[goal.concern];
  const span = goal.target - goal.from || 1;
  const pct = Math.max(0, Math.min(1, (now - goal.from) / span));
  const reached = now >= goal.target;
  const daysLeft = Math.max(0, Math.ceil((new Date(goal.by).getTime() - Date.now()) / DAY));
  const checkins = scans.filter((s) => s.capturedAt >= goal.setAt).length;
  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <section className={`mb-8 flex flex-wrap items-center gap-6 rounded-[2rem] p-6 ${reached ? "bg-good-soft" : "border border-line bg-surface"}`}>
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-blush-100" />
          <motion.circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={reached ? "stroke-good" : "stroke-plum"}
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: 1, ease: EASE }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-center">
          <span>
            <span className="block font-display text-3xl text-ink">{Math.round(pct * 100)}%</span>
            <span className="text-[10px] uppercase tracking-wider text-muted">of goal</span>
          </span>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-plum">
          {reached ? <PartyPopper className="size-4" /> : <Target className="size-4" />} {reached ? "Goal reached" : "Your goal"}
        </p>
        <p className="mt-1 font-display text-2xl text-ink">{CONCERNS[goal.concern].label}</p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Step label="Start" value={goal.from} />
          <span className="h-px w-6 bg-line" />
          <Step label="Now" value={now} strong />
          <span className="h-px w-6 bg-line" />
          <Step label="Aim" value={goal.target} />
        </div>
        <p className="mt-3 text-xs text-muted">
          {reached
            ? "You hit it. Keep the routine going, or set a new aim."
            : `${goal.target - now} points to go · ${daysLeft} days left · ${checkins} check-in${checkins === 1 ? "" : "s"} since you set it`}
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="rounded-full border border-line bg-surface px-4 py-2 text-xs text-plum">{reached ? "New goal" : "Edit"}</button>
        <button onClick={() => setGoal(null)} aria-label="Remove goal" className="grid size-8 place-items-center rounded-full text-muted hover:bg-bad-soft hover:text-bad">
          <X className="size-4" />
        </button>
      </div>
    </section>
  );
}

function Step({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <span className={`rounded-2xl px-3 py-1.5 text-center ${strong ? "bg-plum-deep text-white" : "bg-blush-100 text-ink"}`}>
      <span className="block font-display text-lg leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-wider opacity-80">{label}</span>
    </span>
  );
}

function GoalForm({ onDone }: { onDone: () => void }) {
  const { latest, goal, setGoal } = useStore();
  const lowest = [...CONCERN_KEYS].sort((a, b) => latest!.scores[a] - latest!.scores[b]);
  const [concern, setConcern] = useState<ConcernKey>(goal?.concern ?? lowest[0]);
  const now = latest!.scores[concern];
  const [gain, setGain] = useState(10);
  const [weeks, setWeeks] = useState(8);
  const target = Math.min(100, now + gain);

  return (
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-[2rem] border border-line bg-surface p-6">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-plum">
          <Target className="size-4" /> Set a goal
        </p>
        <p className="mt-1 font-display text-2xl">What do you want to improve?</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {lowest.map((k, i) => (
            <button
              key={k}
              onClick={() => setConcern(k)}
              aria-pressed={concern === k}
              className={`rounded-full px-4 py-2 text-xs transition ${concern === k ? "bg-plum-deep text-white" : "border border-line bg-blush-50 text-ink hover:border-plum"}`}
            >
              {CONCERNS[k].label} · {latest!.scores[k]}
              {i < 3 && concern !== k && <span className="ml-1 text-plum">•</span>}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-blush-100 px-4 py-2 text-center">
              <span className="block font-display text-2xl">{now}</span>
              <span className="text-[9px] uppercase tracking-wider text-muted">Now</span>
            </span>
            <span className="text-muted">→</span>
            <span className="flex items-center gap-1 rounded-2xl bg-plum-deep px-2 py-1 text-white">
              <button onClick={() => setGain((g) => Math.max(3, g - 1))} aria-label="Lower aim" className="grid size-7 place-items-center rounded-full hover:bg-white/15"><Minus className="size-3.5" /></button>
              <span className="w-12 text-center">
                <span className="block font-display text-2xl">{target}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-80">Aim</span>
              </span>
              <button onClick={() => setGain((g) => Math.min(30, g + 1))} aria-label="Raise aim" className="grid size-7 place-items-center rounded-full hover:bg-white/15"><Plus className="size-3.5" /></button>
            </span>
          </div>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Time frame">
            {WEEKS.map((w) => (
              <button key={w} role="radio" aria-checked={weeks === w} onClick={() => setWeeks(w)} className={`rounded-full px-4 py-2 text-xs ${weeks === w ? "bg-blush-200 text-plum-deep" : "border border-line text-muted"}`}>
                {w} weeks
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted">{gain <= 10 ? "Realistic for 6 to 8 weeks of a routine that suits you." : "Ambitious. Skin usually changes a few points a month."}</p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => {
              setGoal({ concern, from: now, target, by: new Date(Date.now() + weeks * 7 * DAY).toISOString(), setAt: latest!.capturedAt });
              onDone();
            }}
            className="rounded-full bg-plum-deep px-6 py-3 text-sm font-medium text-white hover:bg-plum"
          >
            Set goal
          </button>
          {goal && <button onClick={onDone} className="rounded-full border border-line px-5 py-3 text-sm text-plum">Cancel</button>}
        </div>
      </motion.section>
  );
}
