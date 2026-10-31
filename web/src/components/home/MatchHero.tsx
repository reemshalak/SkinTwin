"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Avatar, avatarFromSeed } from "../Avatar";
import { EASE } from "../motion";
import { ProductThumb } from "../ui";
import { FEATURED } from "@/lib/cohort";
import { CONCERNS } from "@/lib/concerns";
import { personAvatar, personById } from "@/lib/people";
import { productById } from "@/lib/products";
import { similarity, storyOf } from "@/lib/twins";
import type { ConcernKey } from "@/lib/types";

const ROWS: ConcernKey[] = ["oiliness", "pore", "acne", "moisture", "redness"];
const TWIN = FEATURED.find((m) => m.personId === "chloe")!;
const ME = FEATURED.find((m) => m.personId === "mei")!; // the "you" in the demo
const STRANGER = FEATURED.find((m) => m.personId === "grace")!;
const MATCH = similarity(ME.scores, TWIN.scores);
const story = storyOf(TWIN);
const WORKED = productById(story.best.productId)!;
const GAIN = (Object.entries(story.best.delta) as [ConcernKey, number][]).sort((a, b) => b[1] - a[1])[0];

// Loop: a stranger's scores morph into a twin's, the bars line up, the match locks,
// and what worked for them appears. 4 phases.
export function MatchHero() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % 5), 1600);
    return () => clearInterval(id);
  }, []);
  const matched = phase >= 1 && phase <= 4;
  const other = matched ? TWIN : STRANGER;
  const person = personById(other.personId!)!;

  return (
    <div className="relative mx-auto w-full max-w-lg" aria-label={`Your skin compared with ${person.name}'s: ${MATCH}% match`} role="img">
      <div className="grid grid-cols-2 gap-x-10 gap-y-3 sm:gap-x-14">
        {[
          { who: "You", av: avatarFromSeed("you-demo", "Y"), scores: ME.scores, sub: "Combination skin" },
          { who: `${person.name}, ${person.age}`, av: personAvatar(person.id), scores: other.scores, sub: person.city },
        ].map((c, col) => (
          <motion.div key={col} layout className="rounded-[1.75rem] border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center gap-2.5">
              <AnimatePresence mode="popLayout">
                <motion.span key={c.who} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                  <Avatar config={c.av} className="size-10 text-base" />
                </motion.span>
              </AnimatePresence>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.who}</p>
                <p className="truncate text-[11px] text-muted">{c.sub}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {ROWS.map((k) => (
                <li key={k}>
                  <p className="mb-1 text-[10px] text-muted">{CONCERNS[k].label}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-blush-100">
                    <motion.div
                      className={`h-full rounded-full ${col === 0 ? "bg-plum" : matched ? "bg-rose" : "bg-blush-300"}`}
                      animate={{ width: `${c.scores[k]}%` }}
                      transition={{ duration: 0.9, ease: EASE }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Match badge locks in the middle */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
        <AnimatePresence>
          {phase >= 2 && (
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
              className="grid size-16 place-items-center rounded-full bg-plum-deep text-center text-white shadow-soft ring-4 ring-blush-50 sm:size-[4.5rem]"
            >
              <span>
                <span className="block font-display text-xl leading-none sm:text-2xl">{MATCH}%</span>
                <span className="text-[9px] uppercase tracking-widest opacity-80">match</span>
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* What worked for the twin */}
      <div className="mt-3 h-16">
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="flex items-center gap-3 rounded-[1.5rem] bg-gradient-to-r from-blush-100 to-surface p-2.5 pe-4 shadow-card"
            >
              <ProductThumb product={WORKED} size="sm" />
              <p className="min-w-0 flex-1 text-xs">
                <span className="block text-muted">What worked for {personById(TWIN.personId!)!.name}</span>
                <span className="block truncate font-medium">{WORKED.name}</span>
              </p>
              <span className="shrink-0 rounded-full bg-good-soft px-2.5 py-1 text-xs font-medium text-good">
                {CONCERNS[GAIN[0]].label} +{Math.round(GAIN[1])}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
