"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { startAmbient, stopAmbient } from "@/lib/sound";
import { celebrateOnce } from "./Celebrate";
import { useStore } from "@/lib/store";

const PHASES = ["Breathe in", "Hold", "Breathe out", "Hold"] as const;
const SECONDS = 4;
const ROUNDS = 4; // 4 rounds x 16s = about a minute
const todayKey = () => new Date().toISOString().slice(0, 10);

// Box breathing: in 4, hold 4, out 4, hold 4. Music, and a soft buzz at each change on phones.
export function CalmMinute({ onClose }: { onClose: () => void }) {
  const { done, toggleDone } = useStore();
  const [tick, setTick] = useState(-3); // 3-2-1 countdown first
  const total = ROUNDS * PHASES.length * SECONDS;
  const finished = tick >= total;

  useEffect(() => {
    startAmbient();
    return () => stopAmbient();
  }, []);
  useEffect(() => {
    if (finished) {
      celebrateOnce("calm", "Calm and centred", "One minute of breathing done. Great job.", "🌿");
      const k = `${todayKey()}:habits`;
      if (!(done[k] ?? []).includes("rest")) toggleDone(k, "rest");
      return;
    }
    const id = setTimeout(() => setTick((t) => t + 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, finished]);

  const phaseIdx = tick < 0 ? -1 : Math.floor(tick / SECONDS) % PHASES.length;
  useEffect(() => {
    if (phaseIdx >= 0 && !finished && (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) navigator.vibrate?.(phaseIdx % 2 === 0 ? 80 : 30);
  }, [phaseIdx, finished]);

  const inPhase = tick < 0 ? 0 : tick % SECONDS;
  const round = tick < 0 ? 0 : Math.min(ROUNDS, Math.floor(tick / (SECONDS * PHASES.length)) + 1);
  // Where the dot is on the square (0..4 sides).
  const along = phaseIdx < 0 ? 0 : phaseIdx + (inPhase + 1) / SECONDS;
  const side = Math.min(3, Math.floor(along));
  const f = along - side;
  const pos = [
    { x: f, y: 1 },
    { x: 1, y: 1 - f },
    { x: 1 - f, y: 0 },
    { x: 0, y: f },
  ][side];
  const big = phaseIdx === 0 || phaseIdx === 1;

  return (
    <motion.div role="dialog" aria-label="Calm minute" className="fixed inset-0 z-50 grid place-items-center bg-plum-deep/85 p-6 text-white backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button onClick={onClose} aria-label="Close" className="absolute top-5 end-5 rounded-full bg-white/10 p-2 hover:bg-white/20"><X className="size-5" /></button>
      <div className="flex flex-col items-center text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Calm minute{finished ? " · complete" : round ? ` · round ${round} of ${ROUNDS}` : ""}</p>
        <div className="relative mt-8 size-64">
          {/* The box you trace with your breath */}
          <div className="absolute inset-0 rounded-[2rem] border-2 border-white/25" />
          <motion.div className="absolute inset-6 rounded-full bg-gradient-to-br from-rose/70 to-plum/60 blur-[1px]" animate={{ scale: finished ? 1 : big ? 1 : 0.55 }} transition={{ duration: SECONDS, ease: "easeInOut" }} />
          {!finished && phaseIdx >= 0 && (
            <motion.span className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]" animate={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }} transition={{ duration: 1, ease: "linear" }} />
          )}
          <div className="absolute inset-0 grid place-items-center">
            <AnimatePresence mode="wait">
              <motion.div key={finished ? "done" : tick < 0 ? tick : phaseIdx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                {finished ? (
                  <Check className="mx-auto size-10" />
                ) : tick < 0 ? (
                  <span className="font-display text-6xl">{-tick}</span>
                ) : (
                  <>
                    <span className="block font-display text-3xl">{PHASES[phaseIdx]}</span>
                    <span className="mt-1 block text-4xl tabular-nums text-white/80">{SECONDS - inPhase}</span>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <p className="mt-8 max-w-xs text-sm text-white/80">
          {finished ? "Done. Your calm habit is ticked for today. Stress shows up as oil and redness, so this counts." : tick < 0 ? "Sit comfortably. Shoulders down, jaw loose." : "Follow the dot around the square."}
        </p>
        {finished && (
          <button onClick={onClose} className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-medium text-plum-deep">Back to my journal</button>
        )}
      </div>
    </motion.div>
  );
}
