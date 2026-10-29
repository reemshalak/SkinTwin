import { productById } from "./products";
import type { Active, RoutineItem } from "./types";

// Widely cited pairing cautions. Educational, not medical advice.
const RULES: { a: Active; b: Active; level: "avoid" | "caution"; why: string; fix: string }[] = [
  { a: "retinoid", b: "aha", level: "avoid", why: "Retinoids plus AHAs in one routine often over-exfoliate and irritate.", fix: "Use them on alternate nights." },
  { a: "retinoid", b: "bha", level: "avoid", why: "Retinoids plus BHA in one routine raise irritation risk.", fix: "Alternate nights, or move BHA to the morning." },
  { a: "aha", b: "bha", level: "caution", why: "Two exfoliating acids together can strip the barrier.", fix: "Pick one per routine." },
  { a: "retinoid", b: "benzoyl_peroxide", level: "avoid", why: "Benzoyl peroxide can deactivate some retinoids and doubles the dryness.", fix: "Benzoyl peroxide in the morning, retinoid at night." },
  { a: "vitamin_c", b: "aha", level: "caution", why: "Low-pH vitamin C with acids can sting.", fix: "Vitamin C in the morning, acids at night." },
  { a: "vitamin_c", b: "benzoyl_peroxide", level: "caution", why: "Benzoyl peroxide can oxidise vitamin C.", fix: "Keep them in different routines." },
];

export interface Conflict {
  kind: "pair" | "missing_spf";
  slot: "am" | "pm";
  products: string[];
  level: "avoid" | "caution";
  why: string;
  fix: string;
}

const SPF_TRIGGERS: Active[] = ["retinoid", "aha", "bha", "vitamin_c"];

export function findConflicts(routine: RoutineItem[]): Conflict[] {
  const out: Conflict[] = [];
  for (const slot of ["am", "pm"] as const) {
    const items = routine.filter((r) => r.slot === slot).map((r) => productById(r.productId)!).filter(Boolean);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        for (const rule of RULES) {
          const ab = items[i].actives.includes(rule.a) && items[j].actives.includes(rule.b);
          const ba = items[i].actives.includes(rule.b) && items[j].actives.includes(rule.a);
          if (ab || ba) out.push({ kind: "pair", slot, products: [items[i].id, items[j].id], level: rule.level, why: rule.why, fix: rule.fix });
        }
      }
    }
  }
  const all = routine.map((r) => productById(r.productId)!).filter(Boolean);
  const triggers = all.filter((p) => p.actives.some((a) => SPF_TRIGGERS.includes(a)));
  if (triggers.length && !all.some((p) => p.actives.includes("spf"))) {
    out.push({
      kind: "missing_spf",
      slot: "am",
      products: triggers.map((p) => p.id),
      level: "caution",
      why: "Retinoids, acids and vitamin C make skin more sun-sensitive.",
      fix: "Add an SPF to your morning routine.",
    });
  }
  return out;
}

// Pairing conflicts a product would create if added to the routine.
export function conflictsIfAdded(routine: RoutineItem[], productId: string, slot: "am" | "pm") {
  const others = routine.filter((r) => r.productId !== productId);
  return findConflicts([...others, { productId, slot, addedAt: "" }]).filter(
    (c) => c.kind === "pair" && c.products.includes(productId),
  );
}
