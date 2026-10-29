import { clamp } from "./random";
import { CONCERN_KEYS } from "./concerns";
import { ACTIVE_LABELS, productById } from "./products";
import type { Active, Product, Scores } from "./types";

// Finds a product you already own that does the same job as one in a twin's routine.
// Same role (e.g. leave-on treatment vs moisturiser), shared key actives and a
// similar effect profile make a good swap. Products that risk irritating your
// skin are flagged rather than hidden.

const ROLE: Record<Product["category"], string> = {
  serum: "treatment",
  treatment: "treatment",
  exfoliant: "treatment",
  moisturizer: "moisturizer",
  sunscreen: "sunscreen",
  cleanser: "cleanser",
  makeup: "makeup",
};
const MINOR: Active[] = ["fragrance", "occlusive"];

function effectCosine(a: Product, b: Product) {
  const va = CONCERN_KEYS.map((k) => a.effects[k] ?? 0);
  const vb = CONCERN_KEYS.map((k) => b.effects[k] ?? 0);
  const dot = va.reduce((s, v, i) => s + v * vb[i], 0);
  const n = Math.hypot(...va) * Math.hypot(...vb);
  return n ? dot / n : 0;
}

export function swapScore(target: Product, candidate: Product) {
  if (ROLE[target.category] !== ROLE[candidate.category]) return 0;
  // Sunscreen is only replaceable by another sunscreen.
  if (target.actives.includes("spf") !== candidate.actives.includes("spf")) return 0;
  const ta = target.actives.filter((a) => !MINOR.includes(a));
  const ca = candidate.actives.filter((a) => !MINOR.includes(a));
  const shared = ta.filter((a) => ca.includes(a));
  const union = new Set([...ta, ...ca]).size || 1;
  const actives = shared.length / union;
  // Moisturisers and sunscreens are broadly interchangeable; treatments depend on their actives.
  const base = ROLE[target.category] === "treatment" ? 30 : 48;
  const score = base + actives * 35 + effectCosine(target, candidate) * 30;
  return Math.round(clamp(score, 0, 98));
}

export interface Swap {
  productId: string;
  score: number;
  why: string;
  caution?: string;
}

export function findSwap(targetId: string, owned: string[], scores?: Scores): Swap | null {
  const target = productById(targetId);
  if (!target) return null;
  let best: Swap | null = null;
  let bestRank = -1;
  for (const id of owned) {
    if (id === targetId) continue;
    const p = productById(id);
    if (!p) continue;
    const score = swapScore(target, p);
    const risk = scores ? p.risks.find((r) => scores[r.concern] < r.below + 4) : undefined;
    // A swap that suits your skin beats a closer one that might irritate it.
    const rank = score - (risk ? 12 : 0);
    if (score < 55 || rank <= bestRank) continue;
    bestRank = rank;
    const shared = target.actives.filter((a) => !MINOR.includes(a) && p.actives.includes(a));
    const why = shared.length ? `Both have ${shared.slice(0, 2).map((a) => ACTIVE_LABELS[a].toLowerCase()).join(" and ")}` : `Same job: a ${ROLE[p.category] === "moisturizer" ? "moisturiser" : ROLE[p.category]} with a similar effect`;
    best = { productId: p.id, score, why, caution: risk?.reason };
  }
  return best;
}

export type AdoptStep =
  | { kind: "have"; productId: string }
  | { kind: "swap"; productId: string; swap: Swap }
  | { kind: "buy"; productId: string };

// How a twin's routine maps onto what you own.
export function planAdoption(twinProducts: string[], owned: string[], scores?: Scores): AdoptStep[] {
  const used = new Set<string>();
  return twinProducts.map((id) => {
    if (owned.includes(id)) {
      used.add(id);
      return { kind: "have", productId: id };
    }
    const swap = findSwap(id, owned.filter((o) => !used.has(o)), scores);
    if (swap) {
      used.add(swap.productId);
      return { kind: "swap", productId: id, swap };
    }
    return { kind: "buy", productId: id };
  });
}
