"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BedDouble, Check, Droplets, EyeOff, Moon, Smartphone, Sparkles, X } from "lucide-react";
import { celebrate } from "./Celebrate";
import { startAmbient, stopAmbient } from "@/lib/sound";

const STEPS = [
  { id: "phone", icon: Smartphone, label: "Phone face-down", why: "Scrolling pushes sleep later." },
  { id: "routine", icon: Droplets, label: "Night routine done", why: "Actives work best overnight." },
  { id: "patches", icon: Sparkles, label: "Under-eye patches", why: "Cool hydration for puffiness." },
  { id: "pillow", icon: BedDouble, label: "Clean pillowcase", why: "Less friction and bacteria." },
  { id: "mask", icon: EyeOff, label: "Lights off, sleep mask on", why: "Darkness starts repair time." },
] as const;
type StepId = (typeof STEPS)[number]["id"];

// A short bedtime checklist in the app's style. Finishing ticks off tonight's sleep.
export function WindDown({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [done, setDone] = useState<Set<StepId>>(new Set());
  useEffect(() => {
    startAmbient();
    return () => stopAmbient();
  }, []);
  const all = done.size === STEPS.length;
  useEffect(() => {
    if (!all) return;
    onDone();
    celebrate("Sweet dreams", "Your skin repairs while you sleep.", "🌙");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);
  const toggle = (id: StepId) =>
    setDone((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return createPortal(
    <motion.div className="fixed inset-0 z-[55] grid place-items-center bg-plum-deep/30 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-label="Wind down"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-line bg-surface shadow-soft"
      >
        <div className="glow-card relative p-6 text-white">
          <button onClick={onClose} aria-label="Close" className="absolute top-4 end-4 rounded-full bg-white/15 p-1.5 hover:bg-white/25"><X className="size-4" /></button>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-white/80"><Moon className="size-3.5" /> Wind down · {done.size}/{STEPS.length}</p>
          <p className="mt-1 font-display text-3xl">{all ? "Sleep well" : "Time to slow down"}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/25">
            <motion.div className="h-full rounded-full bg-white" animate={{ width: `${(done.size / STEPS.length) * 100}%` }} />
          </div>
        </div>
        <ul className="space-y-1.5 p-4">
          {STEPS.map(({ id, icon: Icon, label, why }) => {
            const on = done.has(id);
            return (
              <li key={id}>
                <button onClick={() => toggle(id)} aria-pressed={on} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start transition ${on ? "bg-blush-100" : "hover:bg-blush-50"}`}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-100 text-plum"><Icon className="size-4" /></span>
                  <span className="flex-1">
                    <span className={`block text-sm ${on ? "text-muted line-through" : "text-ink"}`}>{label}</span>
                    <span className="text-[11px] text-muted">{why}</span>
                  </span>
                  <motion.span animate={{ scale: on ? [1, 1.2, 1] : 1 }} className={`grid size-6 place-items-center rounded-full border-2 ${on ? "border-plum bg-plum text-white" : "border-blush-300"}`}>
                    {on && <Check className="size-3.5" />}
                  </motion.span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="px-6 pb-5 text-center text-[11px] text-muted">Soft music is playing. A website can&apos;t read screen time, so this is on your honour.</p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
