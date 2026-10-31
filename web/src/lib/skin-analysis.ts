import { CONCERN_KEYS } from "./concerns";
import { clamp, gaussian, hashString, mulberry32 } from "./random";
import { sampleById } from "./samples";
import type { ConcernKey, Scores, SkinProfile, YouCamOutput, YouCamTaskResponse } from "./types";

// ui_score is "adjusted upward for user-friendliness"; approximate that for mocks.
const toUi = (raw: number) => Math.round(clamp(35 + raw * 0.65, 1, 100));

export function mockYouCamResponse(scores: Scores): YouCamTaskResponse {
  const output: YouCamOutput[] = CONCERN_KEYS.map((k) => ({
    type: k,
    raw_score: scores[k],
    ui_score: toUi(scores[k]),
    mask_urls: [],
  }));
  return { status: 200, data: { task_status: "success", results: { output } } };
}

// Same parser for mock and live responses.
export function profileFromYouCam(
  res: YouCamTaskResponse,
  meta: Pick<SkinProfile, "source" | "sampleId">,
): SkinProfile {
  const output = res.data.results?.output ?? [];
  const scores = {} as Scores;
  const display = {} as Scores;
  for (const k of CONCERN_KEYS) {
    const o = output.find((x) => x.type === k || x.type === `hd_${k}`);
    scores[k] = Math.round(o?.raw_score ?? 50);
    display[k] = Math.round(o?.ui_score ?? toUi(scores[k]));
  }
  // Same numbers the user sees on every page, so the headline matches the scores under it.
  const overall = Math.round(CONCERN_KEYS.reduce((s, k) => s + scores[k], 0) / CONCERN_KEYS.length);
  return {
    id: crypto.randomUUID(),
    capturedAt: new Date().toISOString(),
    overall,
    scores,
    display,
    ...meta,
  };
}

// Deterministic demo scores for an uploaded photo in mock mode.
export function mockScoresForImage(fingerprint: string): Scores {
  const rand = mulberry32(hashString(fingerprint));
  const scores = {} as Scores;
  for (const k of CONCERN_KEYS) scores[k] = Math.round(clamp(gaussian(rand, 58, 14), 15, 92));
  return scores;
}

export function mockScoresFor(input: { sampleId?: string; fingerprint?: string }): Scores {
  const sample = input.sampleId ? sampleById(input.sampleId) : undefined;
  if (sample) return sample.scores;
  return mockScoresForImage(input.fingerprint ?? "anonymous");
}

// Simulated follow-up scan, used for the "demo history" on the progress screen.
export function progressedScores(base: Scores, weeks: number, focus: ConcernKey[]): Scores {
  const rand = mulberry32(hashString(JSON.stringify(base)) + weeks);
  const next = { ...base };
  for (const k of CONCERN_KEYS) {
    const gain = focus.includes(k) ? 2.2 * weeks : 0.4 * weeks;
    next[k] = Math.round(clamp(base[k] + gain + gaussian(rand, 0, 1.5), 1, 99));
  }
  return next;
}
