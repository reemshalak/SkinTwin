"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "./motion";

// Headline that writes itself in word by word (soft blur to sharp), with an
// optional hand-drawn double underline under one key word.
export function WriteOn({ text, mark, className = "", delay = 0 }: { text: string; mark?: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  // Chinese has no spaces: reveal character by character so it can still wrap,
  // keeping the marked phrase together so it can be underlined.
  const spaced = /\s/.test(text);
  const at = !spaced && mark ? text.indexOf(mark) : -1;
  const words = spaced
    ? text.split(" ")
    : at >= 0
      ? [...Array.from(text.slice(0, at)), mark!, ...Array.from(text.slice(at + mark!.length))]
      : Array.from(text);
  const step = spaced ? 0.04 : 0.02;
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => {
        const clean = w.replace(/[^\w'’-]/g, "");
        const bare = (x: string) => x.replace(/[.,!?؟。？！]+$/, "");
        // Works for Latin words and for Arabic/Chinese tokens matched as written.
        const marked = Boolean(mark) && (w === mark || clean.toLowerCase() === mark!.toLowerCase() || bare(w) === bare(mark!));
        return (
          <span key={i} aria-hidden className="inline-block whitespace-pre">
            <motion.span
              className="relative inline-block"
              initial={reduce ? false : { opacity: 0, y: "0.35em", filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, ease: EASE, delay: delay + i * step }}
            >
              {w}
              {marked && <DoubleUnderline delay={delay + words.length * step + 0.1} />}
            </motion.span>
            {spaced && i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
}

// Two loose pen strokes drawn under a word.
function DoubleUnderline({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 200 24" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.28em] left-[-2%] h-[0.42em] w-[104%] overflow-visible" aria-hidden>
      {["M2 9 C 50 3, 120 3, 198 8", "M10 19 C 70 13, 140 14, 192 18"].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={i ? 3 : 4}
          strokeLinecap="round"
          className="text-rose"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: i ? 0.6 : 0.9 }}
          transition={{ duration: 0.6, ease: EASE, delay: delay + i * 0.25 }}
        />
      ))}
    </svg>
  );
}
