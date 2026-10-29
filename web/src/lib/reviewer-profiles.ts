import { COHORT } from "./cohort";
import { productById } from "./products";

// Abstract, brand-free review records for the four hero product concepts.
export interface ReviewerProfile {
  id: string;
  isVerifiedScan: boolean; // false for seeded demo data, true for live YouCam scans
  productCategory: "exfoliator_toner" | "barrier_cream" | "vitamin_c_serum" | "liquid_foundation";
  productGenericName: string; // e.g. "Aura Thermal 2% BHA Clarifying Toner"
  metrics: {
    oiliness: number; // 0-100 from YouCam Skin AI (higher = more balanced)
    redness: number; // 0-100 from YouCam Skin AI (higher = calmer)
    moisture: number; // 0-100 from YouCam Skin AI (higher = more hydrated)
    sensitivity: number; // 0-100, derived from redness and moisture (higher = more sensitive)
  };
  reviewText: string; // no brand names
  ratingGiven: number; // 1-5 stars
}

const HERO: Record<string, ReviewerProfile["productCategory"]> = {
  "aura-bha-toner": "exfoliator_toner",
  "ceramide-labs-barrier": "barrier_cream",
  "botanical-glow-c": "vitamin_c_serum",
  "solis-silk-foundation": "liquid_foundation",
};

// YouCam doesn't score "sensitivity" directly; it's derived from the two scores that
// track reactivity, weighted towards redness.
export const sensitivityOf = (redness: number, moisture: number) => Math.round(100 - (redness * 0.7 + moisture * 0.3));

export const REVIEWER_PROFILES: ReviewerProfile[] = COHORT.flatMap((m) =>
  m.trials
    .filter((t) => HERO[t.productId])
    .map((t) => {
      const p = productById(t.productId)!;
      return {
        id: `${m.id}-${t.productId}`,
        isVerifiedScan: false,
        productCategory: HERO[t.productId],
        productGenericName: `${p.brand} ${p.name}`,
        metrics: {
          oiliness: m.scores.oiliness,
          redness: m.scores.redness,
          moisture: m.scores.moisture,
          sensitivity: sensitivityOf(m.scores.redness, m.scores.moisture),
        },
        reviewText: t.review,
        ratingGiven: t.rating,
      };
    }),
);
