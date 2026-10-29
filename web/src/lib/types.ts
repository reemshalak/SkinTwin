// Shapes that mirror the YouCam Skin Analysis task response (s2s v2.0).
// Mock data is produced in exactly this shape so the live API is a drop-in swap.
export interface YouCamOutput {
  type: string;
  ui_score: number; // 1-100, adjusted upward for display
  raw_score: number; // 1-100, use for comparisons
  mask_urls: string[];
}

export interface YouCamTaskResponse {
  status: number;
  data: {
    task_status: "running" | "success" | "error";
    results?: { output: YouCamOutput[] };
    error?: string;
  };
}

// The subset of SD concerns the app uses (8 concerns = 12 units per live scan).
export type ConcernKey =
  | "moisture"
  | "oiliness"
  | "redness"
  | "texture"
  | "pore"
  | "acne"
  | "radiance"
  | "wrinkle";

export type Scores = Record<ConcernKey, number>;

export interface SkinProfile {
  id: string;
  capturedAt: string;
  source: "mock" | "live" | "fallback";
  sampleId?: string;
  overall: number;
  scores: Scores; // raw_score per concern; higher is healthier
  display: Scores; // ui_score per concern
  photo?: string; // sample portrait path, or a downscaled selfie kept only in this browser
  note?: string; // private journal note
  photoHash?: string; // to spot the same photo being scanned twice
}

export type Active =
  | "retinoid"
  | "aha"
  | "bha"
  | "vitamin_c"
  | "benzoyl_peroxide"
  | "niacinamide"
  | "ceramides"
  | "hyaluronic_acid"
  | "spf"
  | "occlusive"
  | "fragrance";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "cleanser" | "serum" | "moisturizer" | "exfoliant" | "sunscreen" | "treatment" | "makeup";
  price: number;
  size: string;
  slot: "am" | "pm" | "both";
  actives: Active[];
  ingredients: string[];
  blurb: string;
  // Typical change per concern over ~6 weeks, in raw-score points.
  effects: Partial<Scores>;
  // Extra effects for people whose score on `concern` is below `below`.
  risks: { concern: ConcernKey; below: number; penalty: Partial<Scores>; reason: string }[];
  hue: string; // card gradient
  image?: string; // real product photo
  source?: string; // where the product data comes from
  shades?: { name: string; hex: string }[];
}

export interface ProductTrial {
  productId: string;
  weeks: number;
  delta: Partial<Scores>;
  rating: number;
  review: string;
}

export interface CohortMember {
  id: string;
  personId?: string; // set for featured profiles with a name, photo and story
  archetype: string;
  scores: Scores;
  trials: ProductTrial[];
}

export interface RoutineItem {
  productId: string;
  slot: "am" | "pm";
  addedAt: string;
}
