import { CONCERN_KEYS } from "./concerns";
import type { ConcernKey, RoutineItem, Scores, SkinProfile } from "./types";

export const MIN_WEEKS = 3;

// A review's numbers come from two of your own check-ins, never from typing:
// the scan before you started the product and your latest scan.
export function measureProduct(productId: string, routine: RoutineItem[], scans: SkinProfile[]) {
  const item = routine.find((r) => r.productId === productId);
  if (!scans.length) return null;
  const startedAt = item?.addedAt ? new Date(item.addedAt).getTime() : new Date(scans[0].capturedAt).getTime();
  const before = [...scans].reverse().find((s) => new Date(s.capturedAt).getTime() <= startedAt) ?? scans[0];
  const after = scans[scans.length - 1];
  const weeks = Math.max(0, Math.round((new Date(after.capturedAt).getTime() - new Date(before.capturedAt).getTime()) / (7 * 86_400_000)));
  const used = scans.filter((s) => new Date(s.capturedAt) >= new Date(before.capturedAt)).length;
  const delta: Partial<Scores> = {};
  for (const k of CONCERN_KEYS as ConcernKey[]) {
    const d = after.scores[k] - before.scores[k];
    if (Math.abs(d) >= 1) delta[k] = d;
  }
  const verified = before.id !== after.id && weeks >= MIN_WEEKS;
  return { before, after, weeks, scans: used, delta, verified, inRoutine: Boolean(item) };
}
