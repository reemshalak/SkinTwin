"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Target, X } from "lucide-react";
import { CONCERNS } from "@/lib/concerns";
import { useStore } from "@/lib/store";

const WEEK = 7 * 86_400_000;

// Your long-term goal as a sticky note. It's set, tracked and ticked off on the journal's goal page.
export function GoalCard() {
  const { latest, goal, setGoal } = useStore();
  if (!latest) return null;
  if (!goal) {
    return (
      <Link href="/journal?goal" className="flex items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-plum/40 p-4 text-sm text-plum transition hover:border-plum">
        <Target className="size-5" />
        <span className="flex-1">
          <span className="block font-medium">Set a goal</span>
          <span className="text-xs text-muted">One area, a realistic target over 6 to 12 weeks. Your check-ins track it.</span>
        </span>
        <ArrowRight className="size-4 rtl:rotate-180" />
      </Link>
    );
  }
  const now = latest.scores[goal.concern];
  const pct = Math.max(0, Math.min(1, (now - goal.from) / (goal.target - goal.from || 1)));
  const planned = Math.max(1, Math.round((new Date(goal.by).getTime() - new Date(goal.setAt).getTime()) / WEEK));
  const week = Math.max(1, Math.floor((Date.now() - new Date(goal.setAt).getTime()) / WEEK) + 1);
  return (
    <div className="group relative -rotate-1 rounded-md border border-rose/30 bg-blush-100 text-plum-deep shadow-card transition hover:rotate-0">
      <span aria-hidden className="absolute -top-2 start-8 h-4 w-14 -rotate-3 bg-rose/30" />
      <button onClick={() => setGoal(null)} aria-label="Remove goal" title="Remove goal" className="absolute top-2 end-2 rounded-full p-1 text-muted hover:bg-surface hover:text-bad">
        <X className="size-3.5" />
      </button>
      <Link href="/journal?goal" className="block p-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{goal.reachedAt ? "Goal reached" : `My goal · week ${Math.min(week, planned)} of ${planned}`}</span>
        <span className="mt-0.5 flex items-baseline justify-between gap-3 pe-5">
          <span className="font-display text-xl">{CONCERNS[goal.concern].label} {goal.from} → {goal.target}</span>
          <span className="text-xs text-muted">now {now}</span>
        </span>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface">
          <motion.span initial={{ width: 0 }} animate={{ width: `${goal.reachedAt ? 100 : pct * 100}%` }} className={`block h-full rounded-full ${goal.reachedAt ? "bg-good" : "bg-plum"}`} />
        </span>
        <span className="mt-2 flex items-center gap-1 text-xs text-plum">Open my goal page <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5 rtl:rotate-180" /></span>
      </Link>
    </div>
  );
}
