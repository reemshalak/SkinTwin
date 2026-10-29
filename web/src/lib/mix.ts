import { clamp } from "./random";
import { CONCERN_KEYS } from "./concerns";
import { findConflicts, type Conflict } from "./conflicts";
import { productById } from "./products";
import type { CohortMember, ConcernKey, Product, Scores } from "./types";

// Expected 6-week change from combining products on one person's skin.
// Same demo model as the cohort trials, averaged instead of sampled:
// a typical response, risk penalties weighted by how likely they are,
// diminishing returns when products target the same concern, and a
// penalty for ingredient clashes.

const AVG_RESPONSE = 0.25 * 0.15 + 0.75 * 1.0;
const STACK = [1, 0.55, 0.3]; // 2nd and 3rd product on the same concern add less

export interface MixResult {
  delta: Scores;
  net: number;
  conflicts: Conflict[];
  risks: string[];
  verdict: "great" | "good" | "meh" | "clash";
}

function expected(product: Product, scores: Scores) {
  const gain: Partial<Scores> = {};
  const loss: Partial<Scores> = {};
  for (const [k, base] of Object.entries(product.effects) as [ConcernKey, number][]) {
    gain[k] = base * Math.max(0.3, 1 + (50 - scores[k]) / 60) * AVG_RESPONSE;
  }
  const reasons: string[] = [];
  for (const r of product.risks) {
    const p = clamp((r.below + 6 - scores[r.concern]) / 12, 0, 1);
    if (p >= 0.35) reasons.push(r.reason);
    for (const [k, pen] of Object.entries(r.penalty) as [ConcernKey, number][]) loss[k] = (loss[k] ?? 0) + pen * p;
  }
  return { gain, loss, reasons };
}

export function predictMix(ids: string[], scores: Scores): MixResult {
  const products = ids.map((id) => productById(id)!).filter(Boolean);
  const parts = products.map((p) => expected(p, scores));
  const delta = Object.fromEntries(CONCERN_KEYS.map((k) => [k, 0])) as Scores;

  for (const k of CONCERN_KEYS) {
    const gains = parts.map((x) => x.gain[k] ?? 0).sort((a, b) => b - a);
    delta[k] = gains.reduce((s, g, i) => s + g * (STACK[i] ?? 0.2), 0) + parts.reduce((s, x) => s + (x.loss[k] ?? 0), 0);
  }

  // Everything mixed into one routine, the way people actually layer products.
  const conflicts = findConflicts(products.map((p) => ({ productId: p.id, slot: "pm", addedAt: "" }))).filter((c) => c.kind === "pair");
  for (const c of conflicts) {
    delta.redness -= c.level === "avoid" ? 6 : 2.5;
    delta.moisture -= c.level === "avoid" ? 4 : 1.5;
  }
  for (const k of CONCERN_KEYS) delta[k] = Math.round(clamp(delta[k], -14, 14) * 10) / 10;

  const net = Math.round(CONCERN_KEYS.reduce((s, k) => s + delta[k], 0));
  const worst = Math.min(...CONCERN_KEYS.map((k) => delta[k]));
  const verdict = conflicts.some((c) => c.level === "avoid") ? "clash" : worst <= -4 ? "meh" : net >= 18 ? "great" : net >= 7 ? "good" : "meh";
  return { delta, net, conflicts, risks: Array.from(new Set(parts.flatMap((p) => p.reasons))), verdict };
}

// Twins who used every product in the mix, and how their skin changed overall.
export function twinsWhoTried(ids: string[], twins: { member: CohortMember }[]) {
  const people = twins.filter(({ member }) => ids.every((id) => member.trials.some((t) => t.productId === id)));
  const nets = people.map(({ member }) =>
    member.trials.filter((t) => ids.includes(t.productId)).reduce((s, t) => s + Object.values(t.delta).reduce((a, b) => a + b, 0), 0),
  );
  return { n: people.length, improvedPct: people.length ? Math.round((nets.filter((n) => n >= 5).length / people.length) * 100) : 0 };
}

// Intensities (0-1) for YouCam Skin Simulation from the predicted change.
// Oiliness is left out: in that API a higher value adds shine.
const SIM_KEYS: Partial<Record<ConcernKey, string>> = { wrinkle: "wrinkle", radiance: "radiance", acne: "acne", pore: "pores", texture: "texture", redness: "redness" };
export function simulationIntensities(delta: Scores) {
  const out: Record<string, number> = {};
  for (const [k, api] of Object.entries(SIM_KEYS) as [ConcernKey, string][]) {
    if (delta[k] > 0.5) out[api] = Math.round(clamp(delta[k] / 14, 0.1, 0.9) * 10) / 10;
  }
  return out;
}
