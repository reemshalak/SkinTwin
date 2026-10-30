"use client";

import { useMemo } from "react";
import { conflictsIfAdded, findConflicts } from "./conflicts";
import { firstSunscreen, productById, PRODUCTS } from "./products";
import { fitScore, outcomeFor } from "./twins";
import type { Active, Product, RoutineItem } from "./types";

// Strong actives: one of each per routine is plenty.
const STRONG: Active[] = ["bha", "aha", "retinoid", "benzoyl_peroxide", "vitamin_c"];
// The order people actually apply things.
const ORDER: Product["category"][] = ["cleanser", "exfoliant", "serum", "treatment", "moisturizer", "sunscreen", "makeup"];
export const byApplicationOrder = (a: RoutineItem, b: RoutineItem) =>
  ORDER.indexOf(productById(a.productId)!.category) - ORDER.indexOf(productById(b.productId)!.category);
import { useTwins } from "./use-twins";

// The best-fitting product per category for these twins, skipping clashes,
// plus SPF whenever actives make the skin sun-sensitive.
export function useSuggestedPlan() {
  const { twins } = useTwins();
  return useMemo(() => {
    const rows = PRODUCTS.filter((p) => p.category !== "makeup")
      .map((product) => ({ product, o: outcomeFor(product.id, twins) }))
      .filter((r) => r.o.n >= 5)
      .sort((a, b) => fitScore(b.o) - fitScore(a.o));
    const plan: RoutineItem[] = [];
    const used = new Set<string>();
    const actives = new Set<Active>();
    const improved: Record<string, number> = {};
    const now = new Date().toISOString();
    for (const { product, o } of rows) {
      if (fitScore(o) < 20 || used.has(product.category) || used.size >= 5) continue;
      // Never stack the same strong active (e.g. three salicylic products).
      if (product.actives.some((a) => STRONG.includes(a) && actives.has(a))) continue;
      const slot = product.slot === "am" ? "am" : "pm";
      // A suggested routine should have no clashes at all, not even mild ones.
      if (conflictsIfAdded(plan, product.id, slot).length) continue;
      plan.push({ productId: product.id, slot, addedAt: now });
      // Cleansers are used morning and night.
      if (product.category === "cleanser") plan.push({ productId: product.id, slot: "am", addedAt: now });
      used.add(product.category);
      product.actives.filter((a) => STRONG.includes(a)).forEach((a) => actives.add(a));
      improved[product.id] = o.improvedPct;
    }
    if (findConflicts(plan).some((c) => c.kind === "missing_spf")) {
      plan.push({ productId: firstSunscreen().id, slot: "am", addedAt: new Date().toISOString() });
    }
    return { plan: plan.sort(byApplicationOrder), improved, twins: twins.length };
  }, [twins]);
}
