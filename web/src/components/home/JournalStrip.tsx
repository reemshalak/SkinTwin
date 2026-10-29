"use client";

import { motion } from "motion/react";
import { CountUp, EASE } from "../motion";
import { portraitPath } from "@/lib/people";
import { patchStyle } from "@/lib/zones";

// Four weekly check-ins as polaroids: the same skin close-up, scores climbing.
const WEEKS = [
  { label: "Week 1", score: 62, pores: 34 },
  { label: "Week 3", score: 65, pores: 39 },
  { label: "Week 5", score: 69, pores: 44 },
  { label: "Week 8", score: 73, pores: 49 },
];
const TILT = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"];
const PHOTO = portraitPath("amara");

export function JournalStrip() {
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-24 w-full -translate-y-1/2 text-blush-300 md:block" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden>
        <path d="M10 50 C120 50 140 20 200 22 S300 8 390 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
      </svg>
      <ol className="relative grid grid-cols-2 gap-6 md:grid-cols-4">
        {WEEKS.map((w, i) => (
          <motion.li
            key={w.label}
            initial={{ opacity: 0, y: 30, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: EASE }}
            className={`${TILT[i]} rounded-lg bg-surface p-3 pb-4 shadow-soft transition hover:rotate-0`}
          >
            <div className="aspect-square rounded" style={patchStyle(PHOTO, "pore", 4)} role="img" aria-label={`${w.label} skin close-up`} />
            <div className="mt-3 flex items-baseline justify-between px-1">
              <p className="font-display text-lg">{w.label}</p>
              <p className="font-display text-2xl text-plum-deep">
                <CountUp value={w.score} />
              </p>
            </div>
            <p className="px-1 text-[11px] text-muted">
              Pores <span className="text-good">{i ? `+${w.pores - WEEKS[0].pores}` : w.pores}</span>
            </p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
