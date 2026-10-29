import { CONCERN_KEYS } from "./concerns";
import { COHORT, FEATURED } from "./cohort";
import { productById } from "./products";
import type { CohortMember, ConcernKey, ProductTrial, Scores } from "./types";

export interface Twin {
  member: CohortMember;
  similarity: number; // 0-100
}

// Similarity is RMS distance across the 8 measured scores, mapped to 0-100.
// An RMS gap of 0 points = 100% match; a gap of 40 points = 0%.
export function similarity(a: Scores, b: Scores) {
  const sq = CONCERN_KEYS.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0);
  const rms = Math.sqrt(sq / CONCERN_KEYS.length);
  return Math.max(0, Math.round(100 - rms * 2.5));
}

export const TWIN_THRESHOLD = 80;

// `self` is the sample person being scanned, so they never match themselves.
export function findTwins(scores: Scores, self?: string, cohort: CohortMember[] = COHORT): Twin[] {
  return cohort
    .filter((m) => !self || m.personId !== self)
    .map((member) => ({ member, similarity: similarity(scores, member.scores) }))
    .filter((t) => t.similarity >= TWIN_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);
}

// Closest people with a public profile, allowing a little below the twin threshold.
export function featuredMatches(scores: Scores, self?: string, limit = 8): Twin[] {
  return FEATURED.filter((m) => m.personId !== self)
    .map((member) => ({ member, similarity: similarity(scores, member.scores) }))
    .filter((t) => t.similarity >= TWIN_THRESHOLD - 10)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// A person's best and worst product, by net measured change.
export function storyOf(member: CohortMember) {
  const net = (t: ProductTrial) => Object.values(t.delta).reduce((s, v) => s + v, 0);
  const sorted = [...member.trials].sort((a, b) => net(b) - net(a));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return { best, bestNet: net(best), worst: net(worst) < -2 ? worst : undefined, worstNet: net(worst) };
}

export type Confidence = "none" | "low" | "medium" | "high";

export function confidenceFor(n: number): Confidence {
  if (n < 5) return "none";
  if (n < 15) return "low";
  if (n < 40) return "medium";
  return "high";
}

export interface Outcome {
  n: number;
  improvedPct: number; // net change >= +5
  worsenedPct: number; // any concern <= -4
  avgRating: number;
  avgDelta: Partial<Scores>;
  confidence: Confidence;
  trials: { trial: ProductTrial; member: CohortMember; similarity?: number }[];
}

export function outcomeFor(
  productId: string,
  people: { member: CohortMember; similarity?: number }[],
): Outcome {
  const trials = people.flatMap(({ member, similarity }) =>
    member.trials.filter((t) => t.productId === productId).map((trial) => ({ trial, member, similarity })),
  );
  const n = trials.length;
  const product = productById(productId);
  const keys = new Set<ConcernKey>([
    ...(Object.keys(product?.effects ?? {}) as ConcernKey[]),
    ...(product?.risks.flatMap((r) => Object.keys(r.penalty) as ConcernKey[]) ?? []),
  ]);
  const avgDelta: Partial<Scores> = {};
  for (const k of keys) {
    avgDelta[k] = n ? Math.round((trials.reduce((s, t) => s + (t.trial.delta[k] ?? 0), 0) / n) * 10) / 10 : 0;
  }
  const improved = trials.filter((t) => Object.values(t.trial.delta).reduce((s, v) => s + v, 0) >= 5).length;
  const worsened = trials.filter((t) => Object.values(t.trial.delta).some((v) => v <= -4)).length;
  return {
    n,
    improvedPct: n ? Math.round((improved / n) * 100) : 0,
    worsenedPct: n ? Math.round((worsened / n) * 100) : 0,
    avgRating: n ? Math.round((trials.reduce((s, t) => s + t.trial.rating, 0) / n) * 10) / 10 : 0,
    avgDelta,
    confidence: confidenceFor(n),
    trials,
  };
}

export const everyone = () => COHORT.map((member) => ({ member }));

// Fit = how often it helped twins minus how often it hurt them.
export function fitScore(o: Outcome) {
  return o.improvedPct - o.worsenedPct * 1.5;
}
