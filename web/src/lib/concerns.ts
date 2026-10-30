import { tr, type TKey } from "./i18n-core";
import type { ConcernKey } from "./types";

// Labels are phrased so that a higher score always reads as "better".
const KEYS: ConcernKey[] = ["moisture", "oiliness", "redness", "texture", "pore", "acne", "radiance", "wrinkle"];
// Labels read the current language each time they're used.
export const CONCERNS = Object.fromEntries(
  KEYS.map((k) => [
    k,
    {
      get label() {
        return tr(`c.${k}` as TKey);
      },
      get low() {
        return tr(`cl.${k}` as TKey);
      },
      get high() {
        return tr(`ch.${k}` as TKey);
      },
    },
  ]),
) as Record<ConcernKey, { label: string; low: string; high: string }>;

export const CONCERN_KEYS = KEYS;

export function scoreTone(score: number): "good" | "ok" | "low" {
  if (score >= 70) return "good";
  if (score >= 50) return "ok";
  return "low";
}

// Skin type in the current language (for display).
export function skinTypeLabel(scores: Record<ConcernKey, number>): string {
  return tr(`st.${skinTypeKey(scores)}` as TKey);
}

// Skin type as a stable English id (circles, storage).
export function skinTypeKey(scores: Record<ConcernKey, number>): string {
  const oily = scores.oiliness < 45;
  const dry = scores.moisture < 45;
  if (oily && dry) return "Combination";
  if (oily) return "Oily";
  if (dry) return scores.redness < 50 ? "Dry & sensitive" : "Dry";
  if (scores.redness < 50) return "Sensitive";
  return "Balanced";
}
