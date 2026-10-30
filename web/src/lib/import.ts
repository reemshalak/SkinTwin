import { PRODUCTS } from "./products";

// Turns messy text (a cart screenshot read on-device, or a store page) into
// products from our catalogue. A line that names our brand is an exact match;
// otherwise we pick the closest product by what it is (e.g. "salicylic toner").

export interface ImportMatch {
  productId: string;
  line: string; // the text it was found from
  exact: boolean;
  score: number;
}

// Words that describe each product, with weights. Category words alone are weak;
// an active plus a format is a confident match.
const RULES: Record<string, [RegExp, number][]> = {
  "aura-bha-toner": [[/salicylic|\bbha\b/, 3], [/toner|tonic|exfoliat|liquid/, 2]],
  "aura-glycolic-toner": [[/glycolic|\baha\b|lactic/, 3], [/toner|tonic|exfoliat|resurfac/, 2]],
  "aura-pore-serum": [[/pore/, 2], [/salicylic|\bbha\b/, 1], [/niacinamide/, 1], [/serum/, 1]],
  "aura-rice-essence": [[/rice/, 3], [/essence/, 2], [/niacinamide/, 1]],
  "ceramide-labs-barrier": [[/ceramide/, 2], [/barrier|repair/, 2], [/cream|balm/, 1]],
  "ceramide-labs-hydragel": [[/gel|water cream|hyaluronic/, 2], [/moisturi[sz]|cream|hydrat/, 1]],
  "ceramide-labs-clear": [[/oil.?free|clear|balance|mattif/, 2], [/moisturi[sz]|lotion/, 2]],
  "ceramide-labs-night": [[/night|overnight|sleeping/, 2], [/cream|moisturi[sz]/, 1], [/niacinamide/, 1]],
  "botanical-glow-c": [[/vitamin c|vit\.? c|ascorbic|\bc.?serum|brighten/, 3], [/serum|drops/, 1]],
  "botanical-glow-retinol": [[/retinol|retinoid|retinal/, 3], [/squalane|1%|night serum/, 1]],
  "botanical-glow-renewal": [[/encapsulated|renewal|bakuchiol|anti.?ag/, 2], [/retinol|serum/, 1]],
  "aura-clarifying-cleanser": [[/cleanser|face wash|foaming|gel wash/, 3], [/salicylic|\bbha\b|acne|clarif/, 2]],
  "ceramide-labs-cleanser": [[/cleanser|face wash|cleansing/, 3], [/hydrat|gentle|cream|ceramide/, 2]],
  "solis-shield-spf": [[/spf|sunscreen|sun ?cream|uv|sun fluid/, 4]],
  "solis-silk-foundation": [[/foundation|skin tint|bb cream|cc cream/, 4]],
  "solis-silk-lip": [[/lip/, 3], [/balm|butter|oil/, 1]],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9%.\s-]/g, " ").replace(/\s+/g, " ").trim();
// Prices, totals, shipping and other cart chrome are not products.
const NOISE = /^(sub ?total|total|shipping|delivery|tax|vat|discount|qty|quantity|order|checkout|remove|save for later|in stock|free)\b/;

function scoreLine(line: string) {
  return PRODUCTS.map((p) => {
    const name = norm(`${p.brand} ${p.name}`);
    const words = norm(p.name).split(" ").filter((w) => w.length > 3);
    const hits = words.filter((w) => line.includes(w)).length;
    const exact = line.includes(p.brand.toLowerCase()) && hits >= Math.min(2, words.length);
    const rule = (RULES[p.id] ?? []).reduce((n, [re, w]) => n + (re.test(line) ? w : 0), 0);
    return { productId: p.id, exact, score: exact ? 10 + hits : rule + (line.includes(name) ? 10 : 0) };
  }).sort((a, b) => b.score - a.score)[0];
}

export function matchProducts(text: string): ImportMatch[] {
  const lines = text
    .split(/\n|·|\||,|\/|\s(?:and|&)\s/i)
    .map((l) => norm(l.replace(/[$£€]?\s?\d+[.,]\d{2}\b/g, " ")))
    .filter((l) => l.length >= 4 && l.length <= 160 && !NOISE.test(l) && /[a-z]{3}/.test(l));
  const best = new Map<string, ImportMatch>();
  for (const line of lines) {
    const m = scoreLine(line);
    if (!m || m.score < 3) continue;
    const prev = best.get(m.productId);
    if (!prev || m.score > prev.score) best.set(m.productId, { ...m, line });
  }
  return [...best.values()].sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score);
}
