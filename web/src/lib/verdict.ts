import { fitScore, type Outcome } from "./twins";

// One plain-language call per product for *your* skin, with how sure we are.
// Under 5 twins we don't pretend: we say so and use everyone's results.

export type VerdictKind = "good" | "mixed" | "risky" | "few" | "noscan";

export interface Verdict {
  kind: VerdictKind;
  title: string;
  detail: string;
  short: string; // for card chips
  basis: "twins" | "everyone";
}

export function verdictFor(twins: Outcome | null, all: Outcome): Verdict {
  if (!twins) {
    return { kind: "noscan", title: "Will it suit you?", detail: `Scan your skin to see results from people like you. Everyone: ${all.improvedPct}% improved.`, short: `${all.improvedPct}% improved`, basis: "everyone" };
  }
  if (twins.n < 5) {
    return {
      kind: "few",
      title: "Few twins have tried this",
      detail: `Only ${twins.n} people with skin like yours have measured it, so these are everyone's results: ${all.improvedPct}% improved, ${all.worsenedPct}% got worse.`,
      short: "Few twins tried",
      basis: "everyone",
    };
  }
  const worse = Math.round(twins.worsenedPct / 10);
  if (twins.worsenedPct >= 30 || fitScore(twins) < 5) {
    return { kind: "risky", title: "Risky for your skin", detail: `${worse || 1} in 10 twins like you got worse.${twins.improvedPct ? ` ${twins.improvedPct}% improved.` : ""}`, short: `Risky · ${twins.worsenedPct}% worse`, basis: "twins" };
  }
  if (twins.improvedPct >= 60 && twins.worsenedPct < 20) {
    return { kind: "good", title: "Good match for you", detail: `${twins.improvedPct}% of twins like you improved. ${twins.worsenedPct}% got worse.`, short: `${twins.improvedPct}% of twins improved`, basis: "twins" };
  }
  return { kind: "mixed", title: "Mixed for skin like yours", detail: `${twins.improvedPct}% of twins like you improved, ${twins.worsenedPct}% got worse.`, short: `Mixed · ${twins.improvedPct}% improved`, basis: "twins" };
}

export const VERDICT_STYLE: Record<VerdictKind, { chip: string; banner: string }> = {
  good: { chip: "bg-good text-white", banner: "bg-good-soft text-good border-good/30" },
  mixed: { chip: "bg-surface/95 text-ink", banner: "bg-blush-100 text-plum-deep border-blush-200" },
  risky: { chip: "bg-warn text-white", banner: "bg-warn-soft text-warn border-warn-line" },
  few: { chip: "bg-surface/95 text-muted", banner: "bg-blush-50 text-ink border-line" },
  noscan: { chip: "bg-surface/95 text-muted", banner: "bg-blush-50 text-ink border-line" },
};
