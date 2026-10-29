import { CONCERN_KEYS, CONCERNS } from "./concerns";
import { productById, PRODUCTS } from "./products";
import { fitScore, outcomeFor, type Twin } from "./twins";
import type { ConcernKey, Product, RoutineItem, SkinProfile } from "./types";
import { measureProduct } from "./verify";

// The weekly check-in story: what moved, which product it's likely from,
// and a keep / pause / swap call for each product, from your own scans.

const DAY = 86_400_000;
const WEEK = 7 * DAY;

export type Call = "keep" | "working" | "pause" | "swap" | "early";

export interface ProductCall {
  productId: string;
  call: Call;
  reason: string;
  weeks: number;
  swapFor?: string;
}

// The concerns a product is meant to help, strongest first.
const targets = (p: Product) =>
  (Object.entries(p.effects) as [ConcernKey, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k);

function betterOption(p: Product, twins: Twin[], exclude: string[]) {
  return PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id && !exclude.includes(x.id))
    .map((x) => ({ x, o: outcomeFor(x.id, twins) }))
    .filter(({ o }) => o.n >= 5 && fitScore(o) > fitScore(outcomeFor(p.id, twins)) + 10)
    .sort((a, b) => fitScore(b.o) - fitScore(a.o))[0]?.x.id;
}

export function productCalls(routine: RoutineItem[], scans: SkinProfile[], twins: Twin[]): ProductCall[] {
  const ids = Array.from(new Set(routine.map((r) => r.productId)));
  return ids.flatMap((id): ProductCall[] => {
    const p = productById(id);
    const m = measureProduct(id, routine, scans);
    if (!p || !m) return [];
    const weeks = m.weeks;
    const hurt = p.risks
      .flatMap((r) => Object.keys(r.penalty) as ConcernKey[])
      .find((k) => (m.delta[k] ?? 0) <= -4);
    const goal = targets(p);
    const gain = goal.reduce((s, k) => s + (m.delta[k] ?? 0), 0);
    if (hurt) {
      return [{ productId: id, call: "pause" as const, weeks, reason: `${CONCERNS[hurt].label} is down ${Math.abs(Math.round(m.delta[hurt]!))} since you started it. Pause for a week and see if it settles.` }];
    }
    if (weeks < 2) return [{ productId: id, call: "early" as const, weeks, reason: "Too early to tell. Most products take 3 to 6 weeks." }];
    if (gain >= 3) {
      return [{ productId: id, call: "working" as const, weeks, reason: `${goal.map((k) => CONCERNS[k].label).join(" and ")} up ${Math.round(gain)} since you started.` }];
    }
    if (weeks >= 6) {
      const swapFor = betterOption(p, twins, ids);
      return [{ productId: id, call: "swap" as const, weeks, swapFor, reason: `${weeks} weeks with little change in ${goal.map((k) => CONCERNS[k].label.toLowerCase()).join(" or ")}.` }];
    }
    return [{ productId: id, call: "keep" as const, weeks, reason: "No big change yet. Give it a few more weeks." }];
  });
}

// What moved since the last check-in, and the product most likely behind it.
export function weekMoves(prev: SkinProfile, cur: SkinProfile, routine: RoutineItem[]) {
  const ids = routine.map((r) => r.productId);
  return CONCERN_KEYS.map((k) => {
    const d = cur.scores[k] - prev.scores[k];
    const by = ids
      .map((id) => productById(id)!)
      .filter((p) => p && (d > 0 ? (p.effects[k] ?? 0) > 0 : p.risks.some((r) => k in r.penalty)))
      .sort((a, b) => (b.effects[k] ?? 0) - (a.effects[k] ?? 0))[0];
    return { k, d, by: Math.abs(d) >= 2 ? by?.id : undefined };
  })
    .filter((m) => m.d !== 0)
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
}

// Where your progress sits among your twins' measured results at the same point.
export function twinPace(scans: SkinProfile[], twins: Twin[]) {
  if (scans.length < 2) return null;
  const first = scans[0];
  const last = scans[scans.length - 1];
  const weeks = Math.max(1, Math.round((new Date(last.capturedAt).getTime() - new Date(first.capturedAt).getTime()) / WEEK));
  const mine = CONCERN_KEYS.reduce((s, k) => s + (last.scores[k] - first.scores[k]), 0);
  // Each twin's best trial, scaled to the same number of weeks.
  const theirs = twins
    .map(({ member }) => Math.max(...member.trials.map((t) => (Object.values(t.delta).reduce((a, b) => a + b, 0) / Math.max(1, t.weeks)) * weeks)))
    .filter(Number.isFinite);
  if (theirs.length < 5) return null;
  // Kept between 5% and 95%: a small sample shouldn't claim first or last place.
  const ahead = Math.min(95, Math.max(5, Math.round((theirs.filter((t) => t < mine).length / theirs.length) * 100)));
  return { weeks, mine: Math.round(mine), ahead, n: theirs.length };
}

// Weeks in a row with at least one check-in, counting back from this week.
export function streak(scans: SkinProfile[], at = Date.now()) {
  // Demo check-ins can be dated ahead; count from whichever is later.
  const now = Math.max(at, ...scans.map((s) => new Date(s.capturedAt).getTime()));
  const weeksAgo = new Set(scans.map((s) => Math.floor((now - new Date(s.capturedAt).getTime()) / WEEK)));
  let n = 0;
  while (weeksAgo.has(n)) n++;
  const last = scans.length ? new Date(scans[scans.length - 1].capturedAt).getTime() : 0;
  const daysSince = last ? Math.floor((now - last) / DAY) : Infinity;
  // Last 8 weeks, oldest first, for the dots.
  const dots = Array.from({ length: 8 }, (_, i) => weeksAgo.has(7 - i));
  return { n, daysSince, dots, due: daysSince >= 7, missed: daysSince >= 10 };
}
