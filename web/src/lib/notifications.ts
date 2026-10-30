import { CONCERNS } from "./concerns";
import { tr } from "./i18n-core";
import { itemsFor, planWeek, weekday } from "./planner";
import { productById } from "./products";
import type { RoutineItem, SkinProfile } from "./types";
import type { SkinGoal, Wellness } from "./store";
import { measureProduct } from "./verify";
import { streak } from "./week";

// The app's inbox: a few timely, useful nudges built from your own data.
// `alert` items are also sent as browser notifications at their time.

export type NoteKind = "checkin" | "routine" | "sleep" | "rest" | "water" | "journal" | "review" | "goal" | "start";

export interface Note {
  id: string; // stable per day so "read" sticks
  kind: NoteKind;
  title: string;
  body: string;
  href: string;
  alert?: boolean;
}

const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function buildNotes(s: {
  scans: SkinProfile[];
  routine: RoutineItem[];
  done: Record<string, string[]>;
  reminderTimes: { am: string; pm: string };
  wellness: Wellness;
  goal: SkinGoal | null;
}, now = new Date()): Note[] {
  const day = now.toISOString().slice(0, 10);
  const t = now.getHours() * 60 + now.getMinutes();
  const notes: Note[] = [];
  const latest = s.scans[s.scans.length - 1];

  if (!latest) {
    return [{ id: "start", kind: "start", title: tr("n.start.t"), body: tr("n.start.b"), href: "/scan" }];
  }

  // Weekly check-in
  const st = streak(s.scans);
  if (st.due) notes.push({ id: `checkin:${day}`, kind: "checkin", title: st.missed ? tr("n.missed.t") : tr("n.checkin.t"), body: st.missed ? tr("n.missed.b") : tr("n.checkin.b"), href: "/scan", alert: true });

  // Routine not done yet, after its reminder time
  const week = planWeek(s.routine, latest.scores);
  for (const slot of ["am", "pm"] as const) {
    const steps = slot === "am" ? s.routine.filter((r) => r.slot === "am") : itemsFor(s.routine, week, weekday(now), "pm");
    const ticked = s.done[`${day}:${slot}`] ?? [];
    const left = steps.filter((r) => !ticked.includes(r.productId)).length;
    if (left && t >= mins(s.reminderTimes[slot])) {
      notes.push({ id: `routine:${slot}:${day}`, kind: "routine", title: slot === "am" ? tr("n.am.t") : tr("n.pm.t"), body: tr("n.left", { n: left }), href: "/routine", alert: true });
    }
  }

  // Wellness
  const w = s.wellness;
  if (w.sleep.on && t >= mins(w.sleep.time) - 30) {
    notes.push({ id: `sleep:${day}`, kind: "sleep", title: tr("n.sleep.t"), body: tr("n.sleep.b", { time: w.sleep.time }), href: "/routine", alert: true });
  }
  if (w.rest.on && t >= mins(w.rest.time)) {
    notes.push({ id: `rest:${day}`, kind: "rest", title: tr("n.rest.t"), body: tr("n.rest.b"), href: "/", alert: true });
  }
  if (w.water.on && now.getHours() >= 9 && now.getHours() <= 21) {
    const slotNo = Math.floor((now.getHours() - 9) / w.water.everyHours);
    notes.push({ id: `water:${day}:${slotNo}`, kind: "water", title: tr("n.water.t"), body: tr("n.water.b"), href: "/", alert: true });
  }
  if (w.journal.on && weekday(now) === w.journal.day) {
    notes.push({ id: `journal:${day}`, kind: "journal", title: tr("n.journal.t"), body: tr("n.journal.b"), href: "/journal" });
  }

  // A product that's been used long enough to review
  for (const r of s.routine) {
    const m = measureProduct(r.productId, s.routine, s.scans);
    if (m?.verified) {
      const p = productById(r.productId);
      if (p) notes.push({ id: `review:${p.id}`, kind: "review", title: tr("n.review.t", { p: p.name }), body: tr("n.review.b", { n: m.weeks }), href: `/share?product=${p.id}` });
      break;
    }
  }

  // Close to the goal
  if (s.goal) {
    const left = s.goal.target - latest.scores[s.goal.concern];
    if (left > 0 && left <= 3) notes.push({ id: `goal:${s.goal.setAt}:${latest.id}`, kind: "goal", title: tr("n.goal.t"), body: tr("n.goal.b", { c: CONCERNS[s.goal.concern].label, n: left }), href: "/me" });
  }

  return notes;
}
