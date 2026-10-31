import RAW from "@/data/catalog.json";
import PACKSHOTS from "@/data/packshots.json";
import type { Active, ConcernKey, Product, Scores } from "./types";

// Demo catalogue with fictional brands (no third-party trademarks). Ingredient
// lists are realistic INCI formulations, several adapted from Open Beauty Facts.
// Actives are detected from each product's own ingredient list; the expected
// effects and risks per active are a documented demo model, not clinical data.

const DETECT: { active: Active; re: RegExp }[] = [
  { active: "retinoid", re: /retinol|retinal\b|retinyl/i },
  { active: "aha", re: /glycolic|lactic acid|mandelic/i },
  { active: "bha", re: /salicylic/i },
  { active: "vitamin_c", re: /ascorbic|ascorbyl/i },
  { active: "benzoyl_peroxide", re: /benzoyl peroxide/i },
  { active: "niacinamide", re: /niacinamide/i },
  { active: "ceramides", re: /ceramide/i },
  { active: "hyaluronic_acid", re: /hyalur/i },
  { active: "occlusive", re: /petrolatum|butyrospermum|shea butter|cera alba|beeswax/i },
  { active: "fragrance", re: /\bparfum\b|fragrance|limonene|linalool/i },
];
const UV_FILTER = /titanium dioxide|zinc oxide|methoxycinnamate|octinoxate|butyl methoxydibenzoylmethane|avobenzone|triazine|octocrylene|homosalate/i;

type Risk = Product["risks"][number];
const PROFILE: Record<Active, { effects: Partial<Scores>; risks: Risk[] }> = {
  retinoid: { effects: { wrinkle: 11, texture: 9, acne: 5, radiance: 4 }, risks: [{ concern: "redness", below: 48, penalty: { redness: -12, moisture: -6 }, reason: "Retinoids commonly irritate sensitive skin at first" }] },
  aha: { effects: { texture: 11, radiance: 9, pore: 4 }, risks: [{ concern: "redness", below: 50, penalty: { redness: -12, moisture: -5 }, reason: "Glycolic acid often irritates sensitive skin" }] },
  bha: { effects: { pore: 10, acne: 11, oiliness: 7, texture: 5 }, risks: [{ concern: "moisture", below: 42, penalty: { redness: -9, moisture: -6 }, reason: "Salicylic acid can sting and dry out already dry skin" }] },
  vitamin_c: { effects: { radiance: 12, texture: 3 }, risks: [{ concern: "redness", below: 42, penalty: { redness: -6 }, reason: "Vitamin C can sting reactive skin" }] },
  benzoyl_peroxide: { effects: { acne: 14, oiliness: 4 }, risks: [{ concern: "moisture", below: 45, penalty: { moisture: -8, redness: -7 }, reason: "Benzoyl peroxide is drying" }] },
  niacinamide: { effects: { oiliness: 7, pore: 6, redness: 5, radiance: 3 }, risks: [{ concern: "redness", below: 35, penalty: { redness: -4 }, reason: "High-strength niacinamide can flush very reactive skin" }] },
  ceramides: { effects: { moisture: 10, redness: 7, texture: 3 }, risks: [] },
  hyaluronic_acid: { effects: { moisture: 9, wrinkle: 2 }, risks: [] },
  spf: { effects: { redness: 4, radiance: 3, wrinkle: 3 }, risks: [{ concern: "oiliness", below: 30, penalty: { oiliness: -2 }, reason: "Sunscreen can feel heavy on very oily skin" }] },
  occlusive: { effects: { moisture: 5 }, risks: [{ concern: "oiliness", below: 42, penalty: { acne: -8, oiliness: -5, pore: -3 }, reason: "Rich, occlusive textures can clog pores on oily skin" }] },
  fragrance: { effects: {}, risks: [{ concern: "redness", below: 52, penalty: { redness: -9 }, reason: "Contains fragrance, which often stings sensitive skin" }] },
};

const HUES = [
  "from-[#F6EDF3] to-[#F0C9D9]",
  "from-[#EEF3F6] to-[#CFE0EA]",
  "from-[#F7F2F6] to-[#E7DDF0]",
  "from-[#FBF0E8] to-[#F2D3C2]",
  "from-[#FFF6E5] to-[#F8DDAA]",
  "from-[#EEF6F6] to-[#CBE7E6]",
  "from-[#FFF0F3] to-[#F7C7D2]",
];

export const ACTIVE_LABELS: Record<Active, string> = {
  retinoid: "Retinoid",
  aha: "AHA",
  bha: "Salicylic acid",
  vitamin_c: "Vitamin C",
  benzoyl_peroxide: "Benzoyl peroxide",
  niacinamide: "Niacinamide",
  ceramides: "Ceramides",
  hyaluronic_acid: "Hyaluronic acid",
  spf: "SPF",
  occlusive: "Rich occlusives",
  fragrance: "Fragrance",
};

const CONCERN_WORD: Record<ConcernKey, string> = {
  moisture: "hydration",
  oiliness: "shine",
  redness: "redness",
  texture: "texture",
  pore: "pores",
  acne: "breakouts",
  radiance: "dullness",
  wrinkle: "fine lines",
};

const KEY_BOTANICALS: [RegExp, string][] = [
  [/centella|madecassoside/i, "Centella"],
  [/artemisia/i, "Mugwort"],
  [/camellia sinensis/i, "Green tea"],
  [/aloe barbadensis/i, "Aloe"],
  [/melaleuca/i, "Tea tree"],
  [/rosa canina/i, "Rosehip oil"],
  [/tripeptide|tetrapeptide/i, "Peptides"],
  [/caffeine/i, "Caffeine"],
  [/kaolin|bentonite/i, "Clay"],
  [/oryza sativa/i, "Rice extract"],
];

const titleCase =(s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s-])\w/g, (m) => m.toUpperCase()) : s);

function build(raw: (typeof RAW)[number], i: number): Product {
  const text = raw.ingredients.join(", ");
  const actives = DETECT.filter((d) => d.re.test(text)).map((d) => d.active);
  if (raw.category === "sunscreen" || (/spf/i.test(raw.name) && UV_FILTER.test(text))) actives.push("spf");
  // Rinse-off products do less, and stacked actives don't add up linearly.
  const wash = (raw.category === "cleanser" ? 0.5 : 1) * (actives.length >= 2 ? 0.6 : 1);
  const effects: Partial<Scores> = raw.category === "moisturizer" ? { moisture: 4 } : {};
  const risks: Risk[] = [];
  for (const a of actives) {
    for (const [k, v] of Object.entries(PROFILE[a].effects) as [ConcernKey, number][]) {
      effects[k] = Math.min(11, (effects[k] ?? 0) + v * wash);
    }
    for (const r of PROFILE[a].risks) if (!risks.some((x) => x.reason === r.reason)) risks.push(r);
  }
  const top = (Object.entries(effects) as [ConcernKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => CONCERN_WORD[k]);
  const lead = actives.filter((a) => a !== "occlusive" && a !== "fragrance").slice(0, 2).map((a) => ACTIVE_LABELS[a]);
  const blurb = lead.length
    ? `${lead.join(" + ")} to target ${top.join(" and ")}.`
    : `A daily ${raw.category === "makeup" ? "lip and skin" : "skin"} essential.`;
  const isTint = raw.id === "sunmere-silk-foundation";
  // Sunscreens are known for their filters; calming products for their botanicals.
  const botanical = KEY_BOTANICALS.find(([re]) => re.test(text))?.[1];
  const key =
    raw.category === "sunscreen" ? (/zinc oxide|titanium dioxide/i.test(text) ? "Mineral filters" : "UV filters")
    : raw.category === "makeup" ? "Colour"
    : lead[0] && !(botanical && lead[0] === "Hyaluronic acid") ? lead[0]
    : botanical ?? (actives.includes("occlusive") ? "Nourishing oils" : "Gentle basic");
  return {
    id: raw.id,
    name: raw.name,
    brand: titleCase(raw.brand),
    category: raw.category as Product["category"],
    price: raw.price,
    size: raw.size || "—",
    slot: raw.slot as Product["slot"],
    actives,
    key,
    ingredients: raw.ingredients.map((s) => titleCase(s.replace(/\s+/g, " ").replace(/^ingredients\/?\s*\w*:\s*/i, ""))),
    blurb,
    image: PACKSHOTS.includes(raw.id) ? `/packshots/${raw.id}.webp` : undefined,
    effects,
    risks,
    hue: HUES[i % HUES.length],
    shades: isTint
      ? [
          { name: "Light", hex: "#EBCDB4" },
          { name: "Light-medium", hex: "#D9AE8C" },
          { name: "Medium", hex: "#C08F68" },
          { name: "Medium-deep", hex: "#9A6A48" },
          { name: "Deep", hex: "#6B452F" },
        ]
      : raw.id === "sunmere-silk-lip"
        ? [
            { name: "Bare", hex: "#C98B7A" },
            { name: "Rose", hex: "#C0566F" },
            { name: "Berry", hex: "#8E2F4E" },
            { name: "Coral", hex: "#E06B5C" },
          ]
        : undefined,
  };
}

export const PRODUCTS: Product[] = RAW.map(build);

// Earlier catalogue ids, so saved routines and reviews still resolve.
const ALIASES: Record<string, string> = Object.fromEntries(RAW.flatMap((r) => r.old.map((o) => [o, r.id])));

export const canonicalId = (id: string) => ALIASES[id] ?? id;
// Every id a product has been stored under, current first.
export const idsOf = (id: string) => [id, ...(RAW.find((r) => r.id === id)?.old ?? [])];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === (ALIASES[id] ?? id));

export const firstSunscreen = () => PRODUCTS.find((p) => p.actives.includes("spf") && p.category === "sunscreen")!;
