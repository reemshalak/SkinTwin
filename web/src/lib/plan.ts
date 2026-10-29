"use client";

import { useMemo } from "react";
import { conflictsIfAdded, findConflicts } from "./conflicts";
import { firstSunscreen, PRODUCTS } from "./products";
import { fitScore, outcomeFor } from "./twins";
import type { RoutineItem } from "./types";
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
    const improved: Record<string, number> = {};
    for (const { product, o } of rows) {
      if (fitScore(o) < 20 || used.has(product.category) || plan.length >= 5) continue;
      const slot = product.slot === "am" ? "am" : "pm";
      // A suggested routine should have no clashes at all, not even mild ones.
      if (conflictsIfAdded(plan, product.id, slot).length) continue;
      plan.push({ productId: product.id, slot, addedAt: new Date().toISOString() });
      used.add(product.category);
      improved[product.id] = o.improvedPct;
    }
    if (findConflicts(plan).some((c) => c.kind === "missing_spf")) {
      plan.push({ productId: firstSunscreen().id, slot: "am", addedAt: new Date().toISOString() });
    }
    return { plan, improved, twins: twins.length };
  }, [twins]);
}
