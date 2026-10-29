import type { ConcernKey } from "./types";

// Labels are phrased so that a higher score always reads as "better".
export const CONCERNS: Record<ConcernKey, { label: string; low: string; high: string }> = {
  moisture: { label: "Hydration", low: "Dehydrated", high: "Well hydrated" },
  oiliness: { label: "Oil balance", low: "Oily", high: "Balanced" },
  redness: { label: "Calmness", low: "Prone to redness", high: "Calm" },
  texture: { label: "Smoothness", low: "Uneven texture", high: "Smooth" },
  pore: { label: "Pores", low: "Visible pores", high: "Refined" },
  acne: { label: "Clarity", low: "Breakout-prone", high: "Clear" },
  radiance: { label: "Glow", low: "Dull", high: "Radiant" },
  wrinkle: { label: "Fine lines", low: "Visible lines", high: "Smooth lines" },
};

export const CONCERN_KEYS = Object.keys(CONCERNS) as ConcernKey[];

export function scoreTone(score: number): "good" | "ok" | "low" {
  if (score >= 70) return "good";
  if (score >= 50) return "ok";
  return "low";
}

export function skinTypeLabel(scores: Record<ConcernKey, number>): string {
  const oily = scores.oiliness < 45;
  const dry = scores.moisture < 45;
  if (oily && dry) return "Combination";
  if (oily) return "Oily";
  if (dry) return scores.redness < 50 ? "Dry & sensitive" : "Dry";
  if (scores.redness < 50) return "Sensitive";
  return "Balanced";
}
