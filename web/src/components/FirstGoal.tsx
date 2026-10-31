"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Sparkles, Target, X } from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";
import { celebrate } from "./Celebrate";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { HAS_AFTER, afterPath } from "@/lib/people";
import { useStore } from "@/lib/store";
import type { ConcernKey, SkinProfile } from "@/lib/types";

// What YouCam Skin Simulation can render; hydration and oil show their nearest visible effect.
const VISIBLE: Record<ConcernKey, string[]> = {
  wrinkle: ["wrinkle"], radiance: ["radiance"], acne: ["acne"], pore: ["pores"], texture: ["texture"], redness: ["redness"],
  moisture: ["texture", "wrinkle"], oiliness: ["pores", "acne"],
};
const GAIN = [6, 4]; // realistic 6-week targets for the weakest and second-weakest areas
const SEEN = "skintwin:first-goal:";

// First scan ever: your starting photo next to a YouCam render of your goal skin.
// `manual`: opened from the journal (e.g. the first pop-up was missed), so it opens right away.
export function FirstGoalReveal({ scan, manual = false, onClose }: { scan: SkinProfile; manual?: boolean; onClose?: () => void }) {
  const { liveScans, setGoal, updateScan, goal: current } = useStore();
  const [open, setOpen] = useState(manual);
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  const [state, setState] = useState<{ busy: boolean; image?: string; note?: string }>({ busy: true });
  const weakest = [...CONCERN_KEYS].sort((a, b) => scan.scores[a] - scan.scores[b]);
  // With a goal already set, picture that goal; otherwise the two weakest areas.
  const focus = current ? [current.concern, ...weakest.filter((k) => k !== current.concern)].slice(0, 2) : weakest.slice(0, 2);
  const photo = scan.photo ?? "/people/amara.jpg";
  const sampleId = photo.match(/\/people\/([a-z]+)\.jpg$/)?.[1];
  const sampleAfter = sampleId && HAS_AFTER.has(sampleId) ? afterPath(sampleId) : undefined;

  // Open once per first scan, after the results have had a moment.
  useEffect(() => {
    if (manual) return;
    try {
      if (localStorage.getItem(SEEN + scan.id)) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(t);
  }, [scan.id, manual]);

  useEffect(() => {
    if (!open) return;
    try {
      localStorage.setItem(SEEN + scan.id, "1");
    } catch {}
    const intensities: Record<string, number> = {};
    focus.forEach((k, i) => VISIBLE[k].forEach((v) => (intensities[v] = Math.max(intensities[v] ?? 0, i ? 0.4 : 0.6))));
    const body = photo.startsWith("data:") ? { imageDataUrl: photo } : { sampleId: sampleId ?? "amara" };
    fetch("/api/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, intensities, live: liveScans }) })
      .then((r) => r.json())
      .catch(() => ({}))
      .then((d: { image?: string; note?: string }) => setState({ busy: false, image: d.image, note: d.note }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goalImage = state.image ?? sampleAfter;
  const keep = () => {
    const k = focus[0];
    // An existing goal keeps its own target and timeline; only the picture is added.
    const goal = current
      ? { concern: current.concern, from: current.from, target: current.target, image: goalImage }
      : { concern: k, from: scan.scores[k], target: Math.min(100, scan.scores[k] + GAIN[0]), image: goalImage };
    updateScan(scan.id, { diary: { ...scan.diary, goal } });
    if (!current) setGoal({ concern: k, from: goal.from, target: goal.target, by: new Date(Date.now() + 42 * 86_400_000).toISOString(), setAt: new Date().toISOString() });
    close();
    celebrate("Goal set!", "It's pinned on page one of your journal.", "🎯");
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-plum-deep/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog"
            aria-label="Your starting point and your goal"
            initial={{ y: 30, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="relative w-full max-w-lg rounded-[2rem] border border-line bg-surface p-5 text-ink shadow-soft"
          >
            <button onClick={close} aria-label="Not now" className="absolute top-4 end-4 rounded-full p-1.5 text-muted hover:text-plum"><X className="size-4" /></button>
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-plum"><Sparkles className="size-3.5" /> Your first scan</p>
            <h2 className="mt-1 font-display text-3xl">Your starting point, and your goal</h2>
            <div className="mt-4 overflow-hidden rounded-[1.5rem]">
              {state.busy ? (
                <div className="grid aspect-[3/4] max-h-[55vh] w-full place-items-center bg-blush-100 text-sm text-plum">
                  <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> {liveScans ? "YouCam is creating your goal skin…" : "Preparing your goal…"}</span>
                </div>
              ) : (
                <BeforeAfter before={photo} after={goalImage ?? photo} afterStyle={goalImage ? undefined : { filter: "saturate(1.05) brightness(1.05) contrast(0.95)" }} labels={["Week 1 · today", "Your goal · ~6 weeks"]} className="aspect-[3/4] max-h-[55vh] w-full" />
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {state.image ? "Your goal skin, generated by YouCam AI Skin Simulation." : state.note ?? (sampleAfter ? "Sample person's real week-8 photo. Turn on YouCam live for your own render." : "Demo preview. Turn on YouCam live in Settings for a real render of your goal.")}
            </p>
            <ul className="mt-3 space-y-1.5">
              {focus.map((k, i) => (
                <li key={k} className="flex items-center gap-2 text-sm">
                  <Target className="size-4 text-plum" />
                  <b className="font-medium">{CONCERNS[k].label}</b> {scan.scores[k]} → {Math.min(100, scan.scores[k] + GAIN[i])}
                  <span className="text-xs text-muted">in about 6 weeks</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Realistic targets, based on how much twins with skin like yours improved.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={keep} disabled={state.busy} className="flex-1 rounded-full bg-plum-deep py-3 text-sm font-medium text-white hover:bg-plum disabled:opacity-60">Make this my goal</button>
              <button onClick={close} className="rounded-full border border-line px-5 text-sm text-muted hover:text-plum">Not now</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
