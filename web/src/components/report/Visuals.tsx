"use client";

import { motion } from "motion/react";
import { EASE } from "../motion";
import type { ConcernKey, Scores } from "@/lib/types";
import { ZONES } from "@/lib/zones";

// Concern level is the inverse of the health score: higher = needs more attention.
export const concernOf = (raw: number) => Math.max(0, Math.min(100, 100 - raw));
export function severity(raw: number): { label: "Low" | "Moderate" | "High"; tone: string } {
  if (raw < 45) return { label: "High", tone: "text-bad" };
  if (raw < 65) return { label: "Moderate", tone: "text-warn" };
  return { label: "Low", tone: "text-good" };
}

const RING_COLORS: [string, string][] = [
  ["#9c5a78", "#e37ea5"],
  ["#5ab0b0", "#9ad7c7"],
  ["#e37ea5", "#f6b7c9"],
  ["#8ac26f", "#c6e59a"],
  ["#8b7ae0", "#c7b8f5"],
];

export function Ring({ value, label, i = 0, size = 92 }: { value: number; label: string; i?: number; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const [a, b] = RING_COLORS[i % RING_COLORS.length];
  const id = `ring-${i}-${label.replace(/\W/g, "")}`;
  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <defs>
            <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-blush-100" strokeWidth="7" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: c * (1 - value / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: i * 0.1, ease: EASE }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-2xl">
          {value}
          <span className="sr-only"> out of 100</span>
        </span>
      </div>
      <figcaption className="text-[11px] text-muted">{label}</figcaption>
    </figure>
  );
}

// Soft heat glows over the photo where each concern shows; stronger = more attention.
export function Heatmap({ scores, keys }: { scores: Scores; keys: ConcernKey[] }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {keys.map((k, i) => {
        const level = concernOf(scores[k]) / 100;
        if (level < 0.3) return null;
        const z = ZONES[k];
        return (
          <motion.span
            key={k}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-multiply blur-xl"
            style={{
              left: `${z.x}%`,
              top: `${z.y}%`,
              width: `${18 + level * 18}%`,
              height: `${14 + level * 14}%`,
              background: `radial-gradient(circle, rgba(232, 77, 90, ${0.35 + level * 0.45}) 0%, rgba(240, 140, 110, ${0.2 + level * 0.3}) 45%, transparent 75%)`,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 + i * 0.08, ease: EASE }}
          />
        );
      })}
    </div>
  );
}

const zoneFill = (raw: number) => {
  const l = concernOf(raw) / 100;
  return { fill: l > 0.55 ? "#f2a6b4" : l > 0.35 ? "#f6c4b4" : "#f4e1c9", opacity: 0.35 + l * 0.6 };
};

// Line-drawn face with tinted zones, like a clinical chart.
export function FaceDiagram({ scores }: { scores: Scores }) {
  const forehead = Math.min(scores.texture, scores.oiliness, scores.wrinkle);
  const cheeks = Math.min(scores.redness, scores.moisture, scores.radiance);
  const nose = Math.min(scores.pore, scores.oiliness);
  const chin = scores.acne;
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full text-ink/40" role="img" aria-label="Face chart of concern areas">
      <path d="M100 12 C150 12 172 52 170 104 C168 150 150 196 100 222 C50 196 32 150 30 104 C28 52 50 12 100 12Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M30 108 C24 110 22 128 30 136 M170 108 C176 110 178 128 170 136" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="58" y="30" width="84" height="40" rx="20" {...zoneFill(forehead)} />
      <ellipse cx="62" cy="128" rx="22" ry="17" {...zoneFill(cheeks)} />
      <ellipse cx="138" cy="128" rx="22" ry="17" {...zoneFill(cheeks)} />
      <rect x="90" y="96" width="20" height="44" rx="10" {...zoneFill(nose)} />
      <ellipse cx="100" cy="192" rx="28" ry="13" {...zoneFill(chin)} />
      <path d="M66 92 Q78 86 90 92 M110 92 Q122 86 134 92" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M70 100 Q78 104 86 100 M114 100 Q122 104 130 100" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M100 100 L96 140 Q100 144 106 140" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M84 166 Q100 174 116 166 M84 166 Q100 162 116 166" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
