import { productById } from "./products";
import type { Active, RoutineItem, Scores } from "./types";

// Spreads strong evening actives across the week so they never share a night,
// with recovery nights in between. Everything else runs daily.
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const STRONG: Active[] = ["retinoid", "aha", "bha", "benzoyl_peroxide"];

export const isStrong = (productId: string) => productById(productId)?.actives.some((a) => STRONG.includes(a)) ?? false;

export interface WeekPlan {
  // For each strong evening product, the weekday indexes (0 = Mon) it's used.
  nights: Record<string, number[]>;
  recovery: number[]; // nights with no strong active
  gentleStart: boolean;
}

export function planWeek(routine: RoutineItem[], scores?: Scores): WeekPlan {
  const strong = routine.filter((r) => r.slot === "pm" && isStrong(r.productId)).map((r) => r.productId);
  const sensitive = Boolean(scores && (scores.redness < 45 || scores.moisture < 40));
  const retinoids = strong.filter((id) => productById(id)!.actives.includes("retinoid"));
  const others = strong.filter((id) => !retinoids.includes(id));
  const nights: Record<string, number[]> = {};

  // Retinoids get the most nights; fewer to start on sensitive skin.
  const retinoidDays = sensitive ? [0, 3] : others.length ? [0, 2, 4] : [0, 2, 4, 6];
  retinoids.forEach((id, i) => (nights[id] = i === 0 ? retinoidDays : [6]));

  const taken = new Set(Object.values(nights).flat());
  const free = [1, 5, 3, 6, 2, 4, 0].filter((d) => !taken.has(d) && (!sensitive || d !== 6));
  const perActive = retinoids.length ? (sensitive ? 1 : 2) : sensitive ? 2 : 3;
  for (const id of others) {
    nights[id] = free.splice(0, perActive).sort();
  }
  const used = new Set(Object.values(nights).flat());
  return { nights, recovery: [0, 1, 2, 3, 4, 5, 6].filter((d) => !used.has(d)), gentleStart: sensitive && strong.length > 0 };
}

// Which routine items to use on a given day and slot.
export function itemsFor(routine: RoutineItem[], plan: WeekPlan, day: number, slot: "am" | "pm") {
  return routine.filter((r) => r.slot === slot && (slot === "am" || !plan.nights[r.productId] || plan.nights[r.productId].includes(day)));
}

export const weekday = (d = new Date()) => (d.getDay() + 6) % 7;

// A clash between two strong evening products is handled if they never share a night.
export function separated(plan: WeekPlan, a: string, b: string) {
  const na = plan.nights[a];
  const nb = plan.nights[b];
  return Boolean(na && nb && !na.some((d) => nb.includes(d)));
}
