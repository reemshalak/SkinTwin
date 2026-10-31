"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE } from "../motion";
import { CONCERNS } from "@/lib/concerns";
import { FEATURED } from "@/lib/cohort";
import { portraitPath } from "@/lib/people";
import { patchStyle, ZONES } from "@/lib/zones";
import type { ConcernKey } from "@/lib/types";

const PHOTO = portraitPath("amara");
// Soft oval fade so the portrait melts into the page instead of sitting in a box.
const MASK = "radial-gradient(ellipse 62% 70% at 50% 44%, black 58%, transparent 100%)";
const SCORES = FEATURED.find((m) => m.personId === "amara")!.scores;
const FRAMES: { k: ConcernKey; size: number }[] = [
  { k: "texture", size: 15 },
  { k: "pore", size: 11 },
  { k: "moisture", size: 13 },
  { k: "acne", size: 12 },
];

// Big soft-edged portrait; scan frames lock onto zones one at a time, each with a reading.
export function HeroPortrait() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (FRAMES.length + 2)), 1300);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PHOTO}
        alt="Sample face being analysed"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ WebkitMaskImage: MASK, maskImage: MASK }}
      />
      <div className="animate-scanline pointer-events-none absolute inset-x-[15%] top-0 h-24 bg-gradient-to-b from-transparent via-white/40 to-transparent" />

      {FRAMES.map(({ k, size }, i) => {
        const z = ZONES[k];
        const on = step > i;
        return (
          <AnimatePresence key={k}>
            {on && (
              <motion.div
                className="absolute"
                style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${size}%`, aspectRatio: "1" }}
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                {/* Corner brackets */}
                <svg viewBox="0 0 40 40" className="absolute inset-0 -translate-x-1/2 -translate-y-1/2" aria-hidden>
                  <path d="M2 12 V2 H12 M28 2 H38 V12 M38 28 V38 H28 M12 38 H2 V28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <motion.div
                  initial={{ opacity: 0, x: z.side === "left" ? 8 : -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`absolute top-0 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-xl border border-white/50 bg-surface/85 p-1.5 pr-3 shadow-card backdrop-blur-md ${
                    z.side === "left" ? "right-[calc(50%+1.5rem)] flex-row-reverse pe-1.5 ps-3" : "left-[calc(50%+1.5rem)]"
                  }`}
                >
                  <span className="size-9 rounded-lg" style={patchStyle(PHOTO, k)} aria-hidden />
                  <span>
                    <span className="block text-[9px] uppercase tracking-[0.16em] text-muted">{CONCERNS[k].label}</span>
                    <span className="block font-display text-base text-ink">{SCORES[k]}</span>
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      })}
    </div>
  );
}
