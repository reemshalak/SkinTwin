import { CONCERN_KEYS, CONCERNS } from "./concerns";
import { PEOPLE } from "./people";
import { PRODUCTS } from "./products";
import { clamp, gaussian, mulberry32 } from "./random";
import type { CohortMember, ConcernKey, Product, ProductTrial, Scores } from "./types";

// Synthetic demo cohort. Clearly labelled as demo data in the UI.
// Score means per archetype are raw-score style values (higher is healthier).
const ARCHETYPES: { name: string; weight: number; mean: Scores }[] = [
  { name: "oily-breakout", weight: 0.24, mean: { moisture: 62, oiliness: 30, redness: 56, texture: 50, pore: 34, acne: 36, radiance: 55, wrinkle: 80 } },
  { name: "dry-sensitive", weight: 0.2, mean: { moisture: 30, oiliness: 76, redness: 36, texture: 52, pore: 70, acne: 72, radiance: 45, wrinkle: 66 } },
  { name: "combination", weight: 0.24, mean: { moisture: 44, oiliness: 42, redness: 60, texture: 55, pore: 46, acne: 55, radiance: 58, wrinkle: 74 } },
  { name: "mature", weight: 0.16, mean: { moisture: 46, oiliness: 68, redness: 62, texture: 44, pore: 58, acne: 82, radiance: 40, wrinkle: 36 } },
  { name: "balanced", weight: 0.16, mean: { moisture: 70, oiliness: 66, redness: 70, texture: 68, pore: 64, acne: 74, radiance: 68, wrinkle: 72 } },
];

export function predictTrial(product: Product, scores: Scores, weeks: number, rand: () => number) {
  const delta: Partial<Scores> = {};
  const factor = weeks / 6;
  // About 1 in 4 people barely respond to any given product.
  const response = rand() < 0.25 ? 0.15 : 0.6 + rand() * 0.8;
  for (const [key, base] of Object.entries(product.effects) as [ConcernKey, number][]) {
    const room = 1 + (50 - scores[key]) / 60; // more room to improve -> bigger gain
    delta[key] = base * factor * Math.max(0.3, room) * response + gaussian(rand, 0, 1.5);
  }
  let harmed = false;
  // Small baseline chance of a reaction to anything with actives.
  if (product.actives.length && rand() < 0.07) {
    harmed = true;
    delta.redness = (delta.redness ?? 0) - (4 + rand() * 4);
  }
  for (const risk of product.risks) {
    // Soft threshold so the line isn't a cliff.
    const p = clamp((risk.below + 6 - scores[risk.concern]) / 12, 0, 1);
    if (rand() < p) {
      harmed = true;
      for (const [key, pen] of Object.entries(risk.penalty) as [ConcernKey, number][]) {
        delta[key] = (delta[key] ?? 0) + pen * (0.7 + rand() * 0.6);
      }
    }
  }
  // Real skin changes over a few weeks are modest: keep each measured change believable.
  for (const k of Object.keys(delta) as ConcernKey[]) delta[k] = Math.round(clamp(delta[k]!, -14, 12) * 10) / 10;
  return { delta, harmed };
}

// One verdict for a trial, shared by review text and profile badges.
export type Verdict = "worked" | "worse" | "little";
export function trialVerdict(delta: Partial<Scores>): Verdict {
  const values = Object.values(delta);
  const net = values.reduce((s, v) => s + v, 0);
  const hurt = values.some((v) => v <= -4);
  if (net >= 5) return "worked";
  if (net <= -2 || hurt) return "worse";
  return "little";
}

const POSITIVE = ["Honestly noticed a difference", "Became a staple for me", "Worth it", "Slow start but it works", "My skin loves this"];
const NEGATIVE = ["Not for me", "Had to stop using it", "Wanted to love it", "Made things worse", "Returned it"];

function reviewText(delta: Partial<Scores>, weeks: number, rand: () => number) {
  const entries = Object.entries(delta) as [ConcernKey, number][];
  const best = entries.reduce<[ConcernKey, number] | null>((a, e) => (!a || e[1] > a[1] ? e : a), null);
  const worst = entries.reduce<[ConcernKey, number] | null>((a, e) => (!a || e[1] < a[1] ? e : a), null);
  const pick = (arr: string[]) => arr[Math.floor(rand() * arr.length)];
  const verdict = trialVerdict(delta);
  // Tone follows the verdict, so a review never contradicts its badge.
  if (verdict === "worked" && worst && worst[1] <= -4) {
    return `Mixed for me. My ${CONCERNS[best![0]].label.toLowerCase()} improved a lot, but ${CONCERNS[worst[0]].label.toLowerCase()} got worse.`;
  }
  if (verdict === "worse" && worst) {
    return `${pick(NEGATIVE)}. ${CONCERNS[worst[0]].label} got worse within ${Math.max(1, Math.round(weeks / 2))} weeks.`;
  }
  if (verdict === "worked" && best) {
    const label = CONCERNS[best[0]].label.toLowerCase();
    // "pores" and "fine lines" are plural.
    return `${pick(POSITIVE)}. After ${weeks} weeks my ${label} ${/s$/.test(label) ? "are" : "is"} clearly better.`;
  }
  return `It's fine. Used it for ${weeks} weeks and didn't see much change either way.`;
}

function buildCohort(size: number, seed: number): CohortMember[] {
  const rand = mulberry32(seed);
  const members: CohortMember[] = [];
  for (let i = 0; i < size; i++) {
    let r = rand();
    const arch = ARCHETYPES.find((a) => (r -= a.weight) <= 0) ?? ARCHETYPES[0];
    const scores = {} as Scores;
    for (const k of CONCERN_KEYS) scores[k] = Math.round(clamp(gaussian(rand, arch.mean[k], 9), 5, 98));

    const trials: ProductTrial[] = [];
    const count = 2 + Math.floor(rand() * 4);
    // Seeded Fisher-Yates: a random-comparator sort differs between JS engines.
    const pool = [...PRODUCTS];
    for (let j = pool.length - 1; j > 0; j--) {
      const k = Math.floor(rand() * (j + 1));
      [pool[j], pool[k]] = [pool[k], pool[j]];
    }
    pool.length = count;
    for (const product of pool) {
      const weeks = 3 + Math.floor(rand() * 8);
      const { delta, harmed } = predictTrial(product, scores, weeks, rand);
      const gain = Object.values(delta).reduce((s, v) => s + Math.max(0, v), 0);
      const loss = Object.values(delta).reduce((s, v) => s + Math.min(0, v), 0);
      // Star ratings are noisy and generous, like real reviews.
      const rating = Math.round(clamp(3.6 + gain / 14 + loss / 9 + gaussian(rand, 0, 0.7) - (harmed ? 0.6 : 0), 1, 5));
      trials.push({ productId: product.id, weeks, delta, rating, review: reviewText(delta, weeks, rand) });
    }
    members.push({ id: `m${(i + 1).toString(36).padStart(3, "0")}`, archetype: arch.name, scores, trials });
  }
  return members;
}

// Featured profiles sit close to their archetype and try 4 products each,
// so every story has a clear "what worked" and usually a "what didn't".
function buildFeatured(seed: number): CohortMember[] {
  const rand = mulberry32(seed);
  return PEOPLE.map((person) => {
    const arch = ARCHETYPES.find((a) => a.name === person.archetype)!;
    const scores = {} as Scores;
    for (const k of CONCERN_KEYS) scores[k] = Math.round(clamp(gaussian(rand, arch.mean[k], 3), 5, 98));
    const pool = PRODUCTS.filter((p) => p.category !== "makeup");
    for (let j = pool.length - 1; j > 0; j--) {
      const k = Math.floor(rand() * (j + 1));
      [pool[j], pool[k]] = [pool[k], pool[j]];
    }
    const trials: ProductTrial[] = pool.slice(0, 4).map((product) => {
      const weeks = 4 + Math.floor(rand() * 6);
      const { delta, harmed } = predictTrial(product, scores, weeks, rand);
      const gain = Object.values(delta).reduce((s, v) => s + Math.max(0, v), 0);
      const loss = Object.values(delta).reduce((s, v) => s + Math.min(0, v), 0);
      const rating = Math.round(clamp(3.6 + gain / 14 + loss / 9 - (harmed ? 0.6 : 0), 1, 5));
      return { productId: product.id, weeks, delta, rating, review: reviewText(delta, weeks, rand) };
    });
    return { id: person.id, personId: person.id, archetype: person.archetype, scores, trials };
  });
}

export const FEATURED: CohortMember[] = buildFeatured(7);
export const COHORT: CohortMember[] = [...FEATURED, ...buildCohort(1240 - FEATURED.length, 20261029)];
export const COHORT_SIZE = COHORT.length;
