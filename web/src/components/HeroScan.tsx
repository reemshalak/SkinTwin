"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE } from "./motion";
import { CONCERNS } from "@/lib/concerns";
import { FEATURED } from "@/lib/cohort";
import { findTwins } from "@/lib/twins";
import { portraitPath } from "@/lib/people";
import { patchStyle, ZONE_ORDER, ZONES } from "@/lib/zones";

const PHOTO = portraitPath("amara");
const amara = FEATURED.find((m) => m.personId === "amara")!;
const TWINS = findTwins(amara.scores, "amara").length;
const SHOW: (typeof ZONE_ORDER)[number][] = ["oiliness", "pore", "moisture", "acne"];

// Looping mini skin-map: markers and labels appear one by one, then reset.
export function HeroScan() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (SHOW.length + 3)), 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTO} alt="Sample face being analysed" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
        <div className="animate-scanline absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-white/35 to-transparent" />
      </div>

      {SHOW.map((k, i) => {
        const z = ZONES[k];
        return (
          <AnimatePresence key={k}>
            {step > i && (
              <motion.div
                className="absolute"
                style={{ left: `${z.x}%`, top: `${z.y}%` }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <span className="absolute -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-surface/70" />
                  <span className="relative block size-2.5 rounded-full border-2 border-white bg-rose" />
                </span>
                <div className={`absolute top-0 flex -translate-y-1/2 items-center ${z.side === "left" ? "right-2 flex-row-reverse" : "left-2"}`}>
                  <span className="h-px w-6 bg-surface/80" />
                  <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-ink/40 p-1.5 pr-3 text-white backdrop-blur-md">
                    <span className="size-9 rounded-lg border border-white/40" style={patchStyle(PHOTO, k)} aria-hidden />
                    <span>
                      <span className="block text-[9px] uppercase tracking-[0.16em] opacity-80">{CONCERNS[k].label}</span>
                      <span className="block font-display text-sm">{amara.scores[k]}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      })}

      <AnimatePresence>
        {step > SHOW.length && (
          <motion.div
            className="absolute -right-3 bottom-8 rounded-2xl bg-surface p-3 pr-5 shadow-soft sm:-right-8"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Skin twins found</p>
            <p className="font-display text-3xl text-plum-deep">{TWINS}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
