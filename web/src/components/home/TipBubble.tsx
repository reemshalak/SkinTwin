"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CircleDot, Droplet, Droplets, Feather, Flame, Heart, ShieldCheck, Sun, Waves, X } from "lucide-react";
import type { ConcernKey } from "@/lib/types";

const ICON: Record<ConcernKey, typeof Heart> = {
  moisture: Droplets,
  oiliness: Droplet,
  redness: Flame,
  texture: Waves,
  pore: CircleDot,
  acne: ShieldCheck,
  radiance: Sun,
  wrinkle: Feather,
};

// Little hearts that drift up and fade, like warmth rising.
function Hearts() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute bottom-6 text-rose"
          style={{ left: `${30 + i * 18}%` }}
          initial={{ y: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: -46, opacity: [0, 1, 0], scale: [0.6, 1, 0.8], x: [0, i % 2 ? 6 : -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.9, repeatDelay: 1.2, ease: "easeOut" }}
        >
          <Heart className="size-3 fill-current" />
        </motion.span>
      ))}
    </span>
  );
}

// One small, warm tip at a time. Tap it for another.
export function TipBubble({ tips }: { tips: { concern: ConcernKey; label: string; text: string }[] }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!tips.length) return null;
  const tip = tips[i % tips.length];
  const Icon = ICON[tip.concern];
  return (
    <div className="fixed end-4 bottom-28 z-30 flex flex-col items-end gap-2 lg:end-8 lg:bottom-8">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            style={{ originX: 1, originY: 1 }}
            className="relative"
          >
            <button
              onClick={() => setI((n) => n + 1)}
              aria-label="Next tip"
              className="relative flex w-64 items-start gap-3 rounded-[1.5rem] rounded-ee-sm border border-rose/25 bg-gradient-to-br from-surface to-blush-100 p-3 pe-7 text-start shadow-soft"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={i}
                  initial={{ rotate: -30, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blush-200 to-rose/40 text-plum-deep"
                >
                  <Icon className="size-4" />
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.span key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="block">
                  <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-plum">{tip.label}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-ink">{tip.text}</span>
                </motion.span>
              </AnimatePresence>
            </button>
            <button onClick={() => setOpen(false)} aria-label="Hide tip" className="absolute top-2 end-2 rounded-full p-0.5 text-muted hover:text-plum">
              <X className="size-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Hide skin tip" : "Show a skin tip"}
        aria-expanded={open}
        whileTap={{ scale: 0.9 }}
        className="relative grid size-12 place-items-center rounded-full bg-gradient-to-br from-rose to-plum text-white shadow-soft"
      >
        {/* Warm glow that breathes */}
        <motion.span aria-hidden className="absolute -inset-2 rounded-full bg-rose/30 blur-md" animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <Hearts />
        <motion.span className="relative" animate={{ scale: [1, 1.15, 1, 1.1, 1] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6 }}>
          <Heart className="size-5 fill-current" />
        </motion.span>
      </motion.button>
    </div>
  );
}
