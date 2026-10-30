import { describe, expect, it } from "vitest";
import { trialVerdict } from "@/lib/cohort";
import { matchProducts } from "@/lib/import";
import { predictMix } from "@/lib/mix";
import { planWeek, separated } from "@/lib/planner";
import { findSwap, swapScore } from "@/lib/substitute";
import { outcomeFor, similarity, TWIN_THRESHOLD } from "@/lib/twins";
import { productById } from "@/lib/products";
import { verdictFor } from "@/lib/verdict";
import type { Scores } from "@/lib/types";

const oily: Scores = { moisture: 62, oiliness: 30, redness: 56, texture: 50, pore: 34, acne: 36, radiance: 55, wrinkle: 80 };
const dry: Scores = { moisture: 30, oiliness: 76, redness: 36, texture: 52, pore: 70, acne: 72, radiance: 45, wrinkle: 66 };
const shift = (s: Scores, d: number) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v + d])) as Scores;

describe("twin matching", () => {
  it("is 100% for identical skin and symmetric", () => {
    expect(similarity(oily, oily)).toBe(100);
    expect(similarity(oily, dry)).toBe(similarity(dry, oily));
  });
  it("puts an 8-point average gap right at the twin threshold", () => {
    expect(similarity(oily, shift(oily, 8))).toBe(TWIN_THRESHOLD);
    expect(similarity(oily, shift(oily, 9))).toBeLessThan(TWIN_THRESHOLD);
  });
  it("does not call very different skin a twin", () => {
    expect(similarity(oily, dry)).toBeLessThan(40);
  });
});

describe("verdicts", () => {
  const base = { n: 30, avgRating: 4, avgDelta: {}, confidence: "medium" as const, trials: [] };
  it("says good, risky or few twins", () => {
    expect(verdictFor({ ...base, improvedPct: 80, worsenedPct: 5 }, { ...base, improvedPct: 70, worsenedPct: 10 }).kind).toBe("good");
    expect(verdictFor({ ...base, improvedPct: 40, worsenedPct: 45 }, { ...base, improvedPct: 70, worsenedPct: 10 }).kind).toBe("risky");
    const few = verdictFor({ ...base, n: 3, improvedPct: 100, worsenedPct: 0 }, { ...base, improvedPct: 70, worsenedPct: 10 });
    expect(few.kind).toBe("few");
    expect(few.basis).toBe("everyone");
  });
  it("classifies a single trial consistently", () => {
    expect(trialVerdict({ pore: 6, acne: 3 })).toBe("worked");
    expect(trialVerdict({ redness: -6, pore: 4 })).toBe("worse");
    expect(trialVerdict({ pore: 1 })).toBe("little");
  });
  it("reports no outcome for people who never tried the product", () => {
    const oilyTwins = [{ member: { id: "o", archetype: "oily-breakout", scores: oily, trials: [] } }];
    expect(outcomeFor("aura-bha-toner", oilyTwins).n).toBe(0);
  });
});

describe("Mix Lab", () => {
  it("flags retinol with a glycolic acid as a clash", () => {
    const mix = predictMix(["botanical-glow-retinol", "aura-glycolic-toner"], oily);
    expect(mix.verdict).toBe("clash");
    expect(mix.conflicts.length).toBeGreaterThan(0);
  });
  it("adds less when two products target the same concern", () => {
    const one = predictMix(["aura-bha-toner"], oily).delta.pore;
    const two = predictMix(["aura-bha-toner", "aura-pore-serum"], oily).delta.pore;
    expect(two).toBeGreaterThan(one);
    expect(two).toBeLessThan(one * 2);
  });
});

describe("weekly planner", () => {
  it("never puts retinol and an acid on the same night", () => {
    const routine = [
      { productId: "botanical-glow-retinol", slot: "pm" as const, addedAt: "" },
      { productId: "aura-glycolic-toner", slot: "pm" as const, addedAt: "" },
    ];
    const week = planWeek(routine, oily);
    expect(separated(week, "botanical-glow-retinol", "aura-glycolic-toner")).toBe(true);
    expect(week.recovery.length).toBeGreaterThan(0);
  });
  it("starts gently on sensitive skin", () => {
    const week = planWeek([{ productId: "botanical-glow-retinol", slot: "pm", addedAt: "" }], dry);
    expect(week.gentleStart).toBe(true);
    expect(week.nights["botanical-glow-retinol"].length).toBeLessThanOrEqual(2);
  });
});

describe("swaps", () => {
  it("never swaps sunscreen for a non-sunscreen", () => {
    expect(swapScore(productById("solis-shield-spf")!, productById("ceramide-labs-hydragel")!)).toBe(0);
  });
  it("swaps one salicylic treatment for another you own", () => {
    const swap = findSwap("aura-bha-toner", ["aura-pore-serum"]);
    expect(swap?.productId).toBe("aura-pore-serum");
  });
});

describe("cart import", () => {
  it("matches generic cart lines to the closest products", () => {
    const ids = matchProducts("Salicylic Acid 2% Exfoliating Toner $18.00\nInvisible Fluid Sunscreen SPF 50\nSubtotal $95.00").map((m) => m.productId);
    expect(ids).toContain("aura-bha-toner");
    expect(ids).toContain("solis-shield-spf");
    expect(ids).toHaveLength(2);
  });
});
