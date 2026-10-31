"use client";

import { currentLang, dateFormat, locale } from "@/lib/i18n-core";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, Mic, Music, Pencil, ScanFace, Square, Target, Volume2, VolumeX, X } from "lucide-react";
import { Delta } from "./ui";
import { GoalPreview } from "./GoalPreview";
import { FirstGoalReveal } from "./FirstGoal";
import { celebrate, celebrateOnce } from "./Celebrate";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { productById } from "@/lib/products";
import { sampleById } from "@/lib/samples";
import { chime, pageTurn, setSoundOn, soundOn, startAmbient, stopAmbient } from "@/lib/sound";
import { useStore } from "@/lib/store";
import type { ConcernKey, RoutineItem, SkinProfile } from "@/lib/types";
import { useDictation } from "@/lib/use-dictation";

const DAY = 86_400_000;
const DATE = dateFormat({ weekday: "long", day: "numeric", month: "long" });
const SHORT = dateFormat({ weekday: "short", day: "numeric", month: "short" });
const HABITS = ["Morning routine", "Evening routine", "Sunscreen", "8 glasses of water", "7+ hours of sleep", "Tried a new product", "Wore makeup", "Picked at my skin"];
const GOAL_HABITS = ["Sunscreen every morning", "Evening routine every night", "8 glasses of water a day", "7+ hours of sleep", "Hands off my face"];
// Scores move a point or two between scans from light and angle alone.
const NOISE = 2;
const TURN = { duration: 0.9, ease: [0.45, 0.05, 0.25, 1] as const };
// Highlighter-pen underline, scrapbook style.
const MARK = "bg-gradient-to-b from-transparent from-55% to-rose/35 to-55% px-0.5";
const MARK_GOOD = "bg-gradient-to-b from-transparent from-55% to-good/25 to-55% px-0.5";
const MARK_BAD = "bg-gradient-to-b from-transparent from-55% to-bad/25 to-55% px-0.5";
const TAG = "inline-block -rotate-1 rounded-sm bg-blush-200/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-plum-deep";

type Patch = Partial<SkinProfile>;
type Goal = NonNullable<NonNullable<SkinProfile["diary"]>["goal"]>;
type Flip = { from: number; to: number };
// One page per week. Extra scans in the same 7 days update that week's page.
interface Week {
  first: SkinProfile; // holds the diary
  latest: SkinProfile; // the scores shown
  count: number;
}

function groupWeeks(scans: SkinProfile[]): Week[] {
  const weeks: Week[] = [];
  for (const s of scans) {
    const w = weeks[weeks.length - 1];
    if (w && new Date(s.capturedAt).getTime() - new Date(w.first.capturedAt).getTime() < 7 * DAY) {
      w.latest = s;
      w.count++;
    } else weeks.push({ first: s, latest: s, count: 1 });
  }
  return weeks;
}

// How much this concern can realistically move in a week, from the products you use.
function weeklyGain(concern: ConcernKey, routine: RoutineItem[]) {
  const hits = routine
    .map((r) => productById(r.productId))
    .filter((p) => p && (p.effects[concern] ?? 0) > 0)
    .map((p) => ({ name: p!.name, gain: p!.effects[concern]! / 4 })); // effects are over ~4 weeks
  const total = hits.reduce((n, h) => n + h.gain, 0);
  const gain = Math.max(NOISE, Math.min(5, Math.round(total)));
  return { gain, from: hits.slice(0, 2).map((h) => h.name) };
}

function useWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

export function JournalBook({ scans, reveal, onSave }: { scans: SkinProfile[]; reveal: boolean; onSave: (id: string, patch: Patch) => void }) {
  const { routine } = useStore();
  const [longGoal, setLongGoal] = useState(false);
  const wide = useWide();
  const weeks = useMemo(() => groupWeeks(scans), [scans]);
  const nextIdx = weeks.length + 1; // the blank "next week" page
  const last = nextIdx + 1; // the goal page, always the back of the book
  const goalImage = [...scans].reverse().find((s) => s.diary?.goal?.image)?.diary?.goal?.image;
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const [asking, setAsking] = useState<number | null>(null);
  const [compare, setCompare] = useState<"last" | "first">("last");
  const [sound, setSound] = useState(true);
  const [ambient, setAmbient] = useState(false);
  const asked = useRef(new Set<number>());
  useEffect(() => setSound(soundOn()), []);
  // Arriving from "Set this week's goal": open straight to this week with the note.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("goal")) return;
    asked.current.add(weeks.length);
    setPage(weeks.length + 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => stopAmbient(), []);

  const land = (n: number) => {
    setPage(n);
    setFlip(null);
    if (n === weeks.length && !weeks[n - 1]?.first.diary?.goal && !asked.current.has(n)) {
      asked.current.add(n);
      setTimeout(() => setAsking(n), 350);
    }
  };
  const go = (n: number) => {
    if (flip || n < 0 || n > last || n === page) return;
    setAsking(null);
    pageTurn();
    if (wide) setFlip({ from: page, to: n });
    else land(n);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (["TEXTAREA", "INPUT"].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const saveGoal = (n: number, goal: Goal) => {
    const s = weeks[n - 1].first;
    onSave(s.id, { diary: { ...s.diary, goal } });
    setAsking(null);
    chime();
  };

  const left = (n: number): ReactNode => {
    if (n === 0) return null;
    if (n === last) return <GoalLeft image={goalImage} reveal={reveal} scans={scans} />;
    if (n === nextIdx) return <NextLeft n={n} />;
    const base = compare === "first" ? weeks[0] : weeks[n - 2];
    return <LeftPage w={weeks[n - 1]} base={base} baseLabel={compare === "first" ? "week 1" : "last week"} n={n} reveal={reveal} compare={compare} setCompare={setCompare} />;
  };
  const right = (n: number): ReactNode => {
    if (n === 0) return <Cover weeks={weeks} onOpen={() => go(1)} />;
    if (n === last) return <GoalRight scans={scans} onNewGoal={() => setLongGoal(true)} />;
    if (n === nextIdx) return <NextRight lastScan={scans[scans.length - 1]} />;
    return <RightPage w={weeks[n - 1]} prev={weeks[n - 2]} next={weeks[n]} onSave={onSave} onAskGoal={() => setAsking(n)} />;
  };

  const fwd = flip ? flip.to > flip.from : true;
  const closed = !flip && page === 0;
  const daysSince = Math.floor((Date.now() - new Date(scans[scans.length - 1].capturedAt).getTime()) / DAY);

  return (
    <section aria-label="Skin journal book" className="mb-12">
      {daysSince >= 7 && (
        <Link href="/scan" className="mb-5 flex items-center gap-3 rounded-[2rem] border-2 border-dashed border-rose bg-blush-100 p-4 text-sm text-plum-deep">
          <ScanFace className="size-5 text-plum" />
          <span className="flex-1"><span className={`font-medium ${MARK}`}>A new week has started.</span> It&apos;s been {daysSince} days. Scan to open this week&apos;s page.</span>
          <span className="rounded-full bg-plum-deep px-4 py-2 text-xs text-white">Start this week →</span>
        </Link>
      )}
      <div className="relative overflow-x-clip [perspective:2600px]">
        {wide ? (
          <div dir="ltr" className={`relative mx-auto grid min-h-[calc(100dvh-12rem)] grid-cols-2 transition-transform duration-700 ${closed ? "-translate-x-1/4" : ""}`}>
            <Half side="left">{flip ? left(fwd ? flip.from : flip.to) : left(page)}</Half>
            <Half side="right">{flip ? right(fwd ? flip.to : flip.from) : right(page)}</Half>
            {flip && (
              <motion.div
                key={`${flip.from}-${flip.to}`}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: fwd ? -180 : 180 }}
                transition={TURN}
                onAnimationComplete={() => land(flip.to)}
                style={{ transformOrigin: fwd ? "0% 50%" : "100% 50%", transformStyle: "preserve-3d" }}
                className={`pointer-events-none absolute inset-y-0 w-1/2 ${fwd ? "left-1/2" : "left-0"}`}
              >
                <Face side={fwd ? "right" : "left"}>{fwd ? right(flip.from) : left(flip.from)}</Face>
                <Face side={fwd ? "left" : "right"} back>{fwd ? left(flip.to) : right(flip.to)}</Face>
                <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: [0, 0.35, 0] }} transition={TURN} className={`absolute inset-0 ${fwd ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-black/40 to-transparent [backface-visibility:hidden]`} />
              </motion.div>
            )}
            {!closed && <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/15 to-transparent" />}
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={page} initial={{ rotateY: 80, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -80, opacity: 0 }} transition={{ duration: 0.55 }} style={{ transformOrigin: "0% 50%" }} className="overflow-hidden rounded-[1.5rem] bg-surface shadow-soft">
              {page === 0 ? right(0) : (<>{left(page)}{right(page)}</>)}
            </motion.div>
          </AnimatePresence>
        )}

        <AnimatePresence>{longGoal && <LongGoalDialog latest={scans[scans.length - 1]} routine={routine} onClose={() => setLongGoal(false)} />}</AnimatePresence>
        <AnimatePresence>
          {asking !== null && weeks[asking - 1] && (
            <GoalNote key={asking} w={weeks[asking - 1]} routine={routine} onPick={(g) => saveGoal(asking, g)} onClose={() => setAsking(null)} />
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous page" className="grid size-11 place-items-center rounded-full border border-line bg-surface text-plum disabled:opacity-30">
          <ChevronLeft className="size-5 rtl:rotate-180" />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: last + 1 }, (_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={i === 0 ? "Cover" : i === last ? "My goal" : i === nextIdx ? "Next week" : `Week ${i}`} className={`h-2 rounded-full transition-all ${i === page ? "w-6 bg-plum" : i === last ? "w-2 bg-rose" : i === nextIdx ? "w-2 border border-dashed border-plum/50" : "w-2 bg-line hover:bg-plum/50"}`} />
          ))}
        </div>
        <button onClick={() => go(page + 1)} disabled={page === last} aria-label="Next page" className="grid size-11 place-items-center rounded-full border border-line bg-surface text-plum disabled:opacity-30">
          <ChevronRight className="size-5 rtl:rotate-180" />
        </button>
        <span className="mx-2 h-6 w-px bg-line" aria-hidden />
        <button
          onClick={() => {
            setSoundOn(!sound);
            setSound(!sound);
            if (sound) setAmbient(false);
          }}
          aria-pressed={sound}
          aria-label="Page sounds"
          className="grid size-11 place-items-center rounded-full border border-line bg-surface text-plum"
        >
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
        <button
          onClick={() => {
            if (ambient) stopAmbient();
            else {
              setSoundOn(true);
              setSound(true);
              startAmbient();
            }
            setAmbient(!ambient);
          }}
          aria-pressed={ambient}
          className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-xs transition ${ambient ? "border-plum bg-plum text-white" : "border-line bg-surface text-plum"}`}
        >
          <Music className="size-4" /> {ambient ? "Calm music on" : "Calm music"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted">Use ← → to turn pages. Scans in the same 7 days update that week&apos;s page.</p>
    </section>
  );
}

// The book turns like a left-to-right book in every language; only its text follows the language.
const pageDir = () => (currentLang() === "ar" ? "rtl" : undefined);

function Half({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  if (!children) return <div />;
  return (
    <div dir={pageDir()} className={`relative overflow-hidden bg-surface shadow-soft ${side === "left" ? "rounded-s-[1.5rem]" : "rounded-e-[1.5rem]"}`}>
      <span aria-hidden className={`absolute inset-y-2 w-1.5 bg-[repeating-linear-gradient(to_right,rgba(0,0,0,0.06)_0,rgba(0,0,0,0.06)_1px,transparent_1px,transparent_3px)] ${side === "left" ? "left-0" : "right-0"}`} />
      {children}
    </div>
  );
}

function Face({ side, back, children }: { side: "left" | "right"; back?: boolean; children: ReactNode }) {
  return (
    <div dir={pageDir()} className={`absolute inset-0 overflow-hidden bg-surface shadow-soft [backface-visibility:hidden] ${side === "left" ? "rounded-s-[1.5rem]" : "rounded-e-[1.5rem]"}`} style={back ? { transform: "rotateY(180deg)" } : undefined}>
      {children}
    </div>
  );
}

function Cover({ weeks, onOpen }: { weeks: Week[]; onOpen: () => void }) {
  const first = weeks[0].first;
  const latest = weeks[weeks.length - 1].latest;
  return (
    <button onClick={onOpen} className="glow-card group relative flex h-full min-h-[calc(100dvh-12rem)] w-full flex-col items-center justify-center gap-3 p-10 text-center text-white">
      <span aria-hidden className="absolute inset-y-0 left-0 w-7 bg-black/20" />
      <span aria-hidden className="absolute inset-6 rounded-[1.25rem] border border-white/30" />
      <p className="text-[11px] uppercase tracking-[0.3em] opacity-80">My skin journal</p>
      <p className="font-display text-6xl">{weeks.length} {weeks.length === 1 ? "week" : "weeks"}</p>
      <p className="text-sm opacity-90">
        {new Date(first.capturedAt).toLocaleDateString(locale(), { month: "short", year: "numeric" })} · {first.overall} → {latest.overall}
      </p>
      <motion.p animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-5 py-2.5 text-sm backdrop-blur group-hover:bg-white/25">
        Open the book →
      </motion.p>
      <p className="absolute bottom-10 flex items-center gap-1.5 text-[11px] opacity-75"><Lock className="size-3" /> Private · photos stay on this device</p>
    </button>
  );
}

function LeftPage({ w, base, baseLabel, n, reveal, compare, setCompare }: { w: Week; base?: Week; baseLabel: string; n: number; reveal: boolean; compare: "last" | "first"; setCompare: (c: "last" | "first") => void }) {
  const s = w.latest;
  const b = base && base !== w ? base.latest : undefined;
  const photo = s.photo ?? (s.sampleId ? sampleById(s.sampleId)?.image : undefined);
  const diff = b ? s.overall - b.overall : 0;
  const best = b ? [...CONCERN_KEYS].sort((x, y) => s.scores[y] - b.scores[y] - (s.scores[x] - b.scores[x]))[0] : undefined;
  return (
    <div className="flex h-full flex-col gap-5 p-8 lg:p-10">
      <div className="flex items-baseline justify-between">
        <span className={TAG}>Week {n}</span>
        <p className="font-display text-lg text-plum-deep">{DATE.format(new Date(w.first.capturedAt))}</p>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative -rotate-2 bg-white p-2.5 pb-8 shadow-card">
          <span aria-hidden className="absolute -top-3 left-1/2 h-5 w-16 -translate-x-1/2 rotate-3 bg-rose/30" />
          <div className="size-32 overflow-hidden bg-blush-100 xl:size-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo && <img src={photo} alt="" className={`h-full w-full object-cover transition ${reveal ? "" : "scale-110 blur-md"}`} />}
          </div>
          <p className="absolute inset-x-0 bottom-2 text-center font-display text-xs text-plum-deep">{SHORT.format(new Date(s.capturedAt))}</p>
        </div>
        <div className="min-w-[10rem] flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Skin score</p>
          <p className="font-display text-6xl text-ink">{s.overall}<span className="text-xl text-muted">/100</span></p>
          {b ? (
            <p className="text-sm">
              <span className={Math.abs(diff) < NOISE ? MARK : diff > 0 ? MARK_GOOD : MARK_BAD}>
                <Delta value={diff} /> vs {baseLabel}
              </span>
              {Math.abs(diff) < NOISE && <span className="block text-xs text-muted">Within normal scan-to-scan wobble (±{NOISE})</span>}
            </p>
          ) : (
            <p className={`text-sm ${MARK}`}>Your starting point</p>
          )}
          {w.count > 1 && <p className="mt-1 text-xs text-muted">{w.count} scans this week · showing the latest</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className={TAG}>All 8 scores</span>
          {n > 1 && (
            <div className="flex rounded-full border border-line p-0.5 text-[11px]">
              {(["last", "first"] as const).map((c) => (
                <button key={c} onClick={() => setCompare(c)} aria-pressed={compare === c} className={`rounded-full px-2.5 py-1 ${compare === c ? "bg-plum text-white" : "text-muted"}`}>
                  vs {c === "last" ? "last week" : "week 1"}
                </button>
              ))}
            </div>
          )}
        </div>
        <ul className="mt-3 space-y-2">
          {CONCERN_KEYS.map((k) => {
            const v = s.scores[k];
            const d = b ? v - b.scores[k] : 0;
            const tone = !b || Math.abs(d) < NOISE ? "bg-plum/60" : d > 0 ? "bg-good" : "bg-bad";
            return (
              <li key={k} className="flex items-center gap-3 text-sm">
                <span className={`w-24 shrink-0 ${k === best && d >= NOISE ? `${MARK_GOOD} text-ink` : "text-muted"}`}>{CONCERNS[k].label}</span>
                <span className="relative h-2 flex-1 rounded-full bg-blush-100">
                  <motion.span initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.7 }} className={`absolute inset-y-0 left-0 rounded-full ${tone}`} />
                  {b && <span title={`${baseLabel}: ${b.scores[k]}`} className="absolute -top-1 h-4 w-0.5 rounded bg-ink/60" style={{ left: `${b.scores[k]}%` }} />}
                </span>
                <span className="w-7 text-end tabular-nums text-ink">{v}</span>
                <span className="w-8 text-end text-xs">{b ? <Delta value={d} /> : null}</span>
              </li>
            );
          })}
        </ul>
        {b && <p className="mt-2 text-[11px] text-muted">The dark tick marks {baseLabel}. Green and red only show changes bigger than ±{NOISE}.</p>}
      </div>
    </div>
  );
}

function NextLeft({ n }: { n: number }) {
  return (
    <div className="grid h-full place-items-center p-10 text-center">
      <div>
        <span className={TAG}>Week {n}</span>
        <p className="mt-4 font-display text-3xl text-muted">This page is waiting for you</p>
        <div className="mx-auto mt-6 grid size-40 -rotate-2 place-items-center border-2 border-dashed border-plum/30 bg-blush-50 text-plum/50">
          <ScanFace className="size-10" />
        </div>
      </div>
    </div>
  );
}

function NextRight({ lastScan }: { lastScan: SkinProfile }) {
  const opens = new Date(new Date(lastScan.capturedAt).getTime() + 7 * DAY);
  const ready = Date.now() >= opens.getTime();
  return (
    <div className="flex h-full flex-col justify-center gap-4 bg-blush-50/40 p-10">
      <p className="font-display text-3xl text-ink">{ready ? <span className={MARK}>Time for a new page</span> : "Next week's page"}</p>
      <p className="text-sm text-muted">
        {ready
          ? "A week has passed. One scan opens this page, and we'll check last week's goal against it."
          : `Opens ${SHORT.format(opens)}. Scanning before then updates this week's page instead. Same light, same spot, no makeup.`}
      </p>
      <Link href="/scan" className={`inline-flex items-center gap-2 self-start rounded-full px-6 py-3 text-sm font-medium ${ready ? "bg-plum-deep text-white" : "border border-line bg-surface text-plum"}`}>
        <ScanFace className="size-4" /> {ready ? "Scan and start this week" : "Scan now anyway"}
      </Link>
    </div>
  );
}

function Line({ label, value, placeholder, onSave }: { label: string; value?: string; placeholder: string; onSave: (v: string) => void }) {
  return (
    <label className="block">
      <span className={TAG}>{label}</span>
      <input
        defaultValue={value}
        onBlur={(e) => e.target.value !== (value ?? "") && onSave(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full border-b-2 border-dashed border-plum/30 bg-transparent pb-1 font-display text-xl text-plum-deep placeholder:text-muted/60 focus:border-plum focus:outline-none"
      />
    </label>
  );
}

function RightPage({ w, prev, next, onSave, onAskGoal }: { w: Week; prev?: Week; next?: Week; onSave: (id: string, patch: Patch) => void; onAskGoal: () => void }) {
  const s = w.first;
  const diary = s.diary ?? {};
  const did = diary.did ?? [];
  const save = (patch: Partial<NonNullable<SkinProfile["diary"]>>) => onSave(s.id, { diary: { ...diary, ...patch } });
  const toggle = (h: string) => save({ did: did.includes(h) ? did.filter((x) => x !== h) : [...did, h] });
  return (
    <div className="flex h-full flex-col gap-4 bg-blush-50/40 p-8 lg:p-10">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-3xl text-ink"><span className={MARK}>Dear diary,</span></p>
        <ReadAloud w={w} prev={prev} />
      </div>
      {diary.goal ? <GoalSticker goal={diary.goal} w={w} next={next} onEdit={onAskGoal} /> : (
        <button type="button" onClick={onAskGoal} className="flex items-center gap-2 self-start rounded-full border-2 border-dashed border-plum/40 px-4 py-2 text-sm text-plum hover:border-plum">
          <Target className="size-4" /> Set this week&apos;s goal
        </button>
      )}
      <Line label="What's working" value={diary.worked} placeholder="My cheeks feel calmer since the new serum…" onSave={(v) => save({ worked: v })} />
      <Line label="What I'll work on" value={diary.focus} placeholder="Sunscreen every single morning" onSave={(v) => save({ focus: v })} />
      <fieldset>
        <legend className={TAG}>This week I…</legend>
        <ul className="mt-2 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
          {HABITS.map((h) => {
            const on = did.includes(h);
            return (
              <li key={h}>
                <button type="button" onClick={() => toggle(h)} aria-pressed={on} className="flex w-full items-center gap-2.5 py-1 text-start text-sm">
                  <motion.span animate={{ scale: on ? [1, 1.25, 1] : 1 }} className={`grid size-5 shrink-0 place-items-center rounded-md border-2 transition ${on ? "border-plum bg-plum text-white" : "border-plum/30"}`}>
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </motion.span>
                  <span className={on ? `text-ink ${MARK}` : "text-muted"}>{h}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>
      <Notes s={s} onSave={onSave} />
    </div>
  );
}

// The goal, taped to the page. Judged against next week's scan, allowing for scan wobble.
function GoalSticker({ goal, w, next, onEdit }: { goal: Goal; w: Week; next?: Week; onEdit: () => void }) {
  const now = next?.latest.scores[goal.concern];
  const gap = next ? (new Date(next.latest.capturedAt).getTime() - new Date(w.first.capturedAt).getTime()) / DAY : 0;
  const verdict = now === undefined ? null : gap < 5 ? "soon" : now >= goal.target ? "reached" : now >= goal.from + NOISE ? "close" : "not";
  const due = new Date(new Date(w.first.capturedAt).getTime() + 7 * DAY);
  useEffect(() => {
    if (verdict === "reached") celebrateOnce(`goal-${w.first.id}`, "Goal reached!", `${CONCERNS[goal.concern].label} hit ${goal.target}. You did that.`, "🎉");
  }, [verdict, w.first.id, goal]);
  const stamp = { reached: ["Reached ✓", "border-good text-good"], close: ["Getting there", "border-plum text-plum"], not: ["Not yet", "border-bad/70 text-bad/80"], soon: ["Too soon", "border-muted text-muted"] } as const;
  return (
    <button type="button" onClick={onEdit} className="group relative -rotate-1 self-start rounded-md border border-rose/30 bg-blush-100 px-4 py-3 text-start text-plum-deep shadow-card transition hover:rotate-0">
      <span aria-hidden className="absolute -top-2 left-6 h-4 w-12 rotate-[-4deg] bg-rose/30" />
      <span className="flex items-center justify-between gap-6 text-[10px] uppercase tracking-[0.2em] text-muted">
        This week&apos;s goal <Pencil className="size-3 opacity-0 transition group-hover:opacity-100" />
      </span>
      <span className="block font-display text-lg">
        <span className={MARK}>{CONCERNS[goal.concern].label} {goal.from} → {goal.target}</span>
      </span>
      {goal.habit && <span className="block text-xs">by: {goal.habit}</span>}
      {goal.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={goal.image} alt="My goal skin" className="mt-2 h-24 w-20 -rotate-2 rounded-sm border-4 border-white object-cover shadow-card" />
      )}
      <span className="mt-1 block text-[11px] text-muted">
        {now === undefined ? `Check in ${SHORT.format(due)} to see if you made it` : `Next scan: ${now} (${Math.abs(now - goal.from)} ${now - goal.from >= 0 ? "better" : "worse"})`}
      </span>
      {verdict && (
        <motion.span initial={{ scale: 2.2, opacity: 0, rotate: -25 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.4 }} className={`absolute -right-8 -top-4 rounded-md border-[3px] bg-surface/90 px-2 py-0.5 font-display text-sm uppercase tracking-wider ${stamp[verdict][1]}`}>
          {stamp[verdict][0]}
        </motion.span>
      )}
    </button>
  );
}

// Pops onto the page: "What's your goal this week?" Targets come from your routine.
function GoalNote({ w, routine, onPick, onClose }: { w: Week; routine: RoutineItem[]; onPick: (g: Goal) => void; onClose: () => void }) {
  const s = w.latest;
  const current = w.first.diary?.goal;
  const weakest = [...CONCERN_KEYS].sort((a, b) => s.scores[a] - s.scores[b]).slice(0, 3);
  const options = current && !weakest.includes(current.concern) ? [current.concern, ...weakest.slice(0, 2)] : weakest;
  const [concern, setConcern] = useState<ConcernKey>(current?.concern ?? weakest[0]);
  const [habit, setHabit] = useState<string | undefined>(current?.habit);
  const from = s.scores[concern];
  const { gain, from: drivers } = weeklyGain(concern, routine);
  const target = Math.min(100, from + gain);
  return (
    <motion.div className="absolute inset-0 z-20 grid place-items-center bg-plum-deep/20 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-label="This week's goal"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: -260, rotate: -14, opacity: 0 }}
        animate={{ y: 0, rotate: -2, opacity: 1 }}
        exit={{ y: 40, rotate: 6, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 170, damping: 15 }}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-md border border-rose/30 bg-blush-50 p-7 text-plum-deep shadow-soft"
      >
        <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-rose/35" />
        <button onClick={onClose} aria-label="Not now" className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-plum"><X className="size-4" /></button>
        <p className="font-display text-3xl"><span className={MARK}>What&apos;s your goal</span> this week?</p>
        <p className="mt-1 text-sm text-muted">Pick one thing. Small, measurable goals are the ones that stick.</p>

        <p className={`mt-5 ${TAG}`}>I want to improve</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((k) => (
            <button key={k} onClick={() => setConcern(k)} aria-pressed={concern === k} className={`rounded-full border-2 px-4 py-1.5 text-sm transition ${concern === k ? "border-plum bg-plum text-white" : "border-plum/25 hover:border-plum"}`}>
              {CONCERNS[k].label} <span className="opacity-70">{s.scores[k]}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-surface p-3 text-sm">
          Target: <span className={`font-display text-lg ${MARK}`}>{from} → {target}</span> by next check-in
          <p className="mt-1 text-xs text-muted">
            {drivers.length
              ? `+${gain} because ${drivers.join(" and ")} in your plan target ${CONCERNS[concern].label.toLowerCase()}.`
              : `+${gain} is the smallest change a scan can reliably tell apart from lighting. Add a product for this to aim higher.`}
          </p>
          <GoalPreview key={concern} scan={s} concern={concern} gain={gain} />
        </div>

        <p className={`mt-5 ${TAG}`}>by sticking to (optional)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOAL_HABITS.map((h) => (
            <button key={h} onClick={() => setHabit(habit === h ? undefined : h)} aria-pressed={habit === h} className={`rounded-full border px-3 py-1 text-xs transition ${habit === h ? "border-plum bg-plum text-white" : "border-plum/25 hover:border-plum"}`}>
              {h}
            </button>
          ))}
        </div>

        <button onClick={() => onPick({ concern, from, target, habit })} className="mt-6 w-full rounded-full bg-plum-deep py-3 text-sm font-medium text-white hover:bg-plum">
          {current ? "Update my goal" : "Stick it in my journal"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function Notes({ s, onSave }: { s: SkinProfile; onSave: (id: string, patch: Patch) => void }) {
  const [text, setText] = useState(s.note ?? "");
  const textRef = useRef(text);
  textRef.current = text;
  const voice = useDictation((t) => {
    const cur = textRef.current;
    const next = `${cur}${cur && !cur.endsWith(" ") ? " " : ""}${t}`;
    setText(next);
    onSave(s.id, { note: next });
  });
  return (
    <label className="flex flex-1 flex-col">
      <span className="flex items-center justify-between">
        <span className={TAG}>Notes</span>
        {voice.supported && (
          <button type="button" onClick={voice.listening ? voice.stop : voice.start} aria-pressed={voice.listening} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${voice.listening ? "animate-pulse bg-rose text-white" : "border border-line bg-surface text-plum hover:border-plum"}`}>
            {voice.listening ? <Square className="size-3" /> : <Mic className="size-3.5" />} {voice.listening ? "Stop" : "Speak"}
          </button>
        )}
      </span>
      <textarea
        value={voice.interim ? `${text} ${voice.interim}` : text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== (s.note ?? "") && onSave(s.id, { note: text })}
        placeholder="Breakouts, stress, travel, your period, a new food… or tap Speak"
        rows={3}
        className="mt-1 min-h-24 w-full flex-1 resize-none bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgba(150,90,120,0.25)_32px)] font-display text-lg leading-8 text-plum-deep placeholder:text-muted/60 focus:outline-none"
      />
      {voice.error && <span className="mt-1 text-xs text-bad">{voice.error}</span>}
    </label>
  );
}

function ReadAloud({ w, prev }: { w: Week; prev?: Week }) {
  const [on, setOn] = useState(false);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk("speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);
  if (!ok) return null;
  const read = () => {
    if (on) {
      window.speechSynthesis.cancel();
      return setOn(false);
    }
    const s = w.latest;
    const d = w.first.diary ?? {};
    const diff = prev ? s.overall - prev.latest.overall : 0;
    const parts = [
      `${DATE.format(new Date(w.first.capturedAt))}. Skin score ${s.overall}${prev ? `, ${diff >= 0 ? "up" : "down"} ${Math.abs(diff)} since last week` : ""}.`,
      d.goal && `My goal: ${CONCERNS[d.goal.concern].label} from ${d.goal.from} to ${d.goal.target}${d.goal.habit ? `, by ${d.goal.habit}` : ""}.`,
      d.worked && `What's working: ${d.worked}.`,
      d.focus && `I'll work on: ${d.focus}.`,
      d.did?.length && `This week I did: ${d.did.join(", ")}.`,
      w.first.note && `Notes: ${w.first.note}`,
    ].filter(Boolean);
    const u = new SpeechSynthesisUtterance(parts.join(" "));
    u.lang = navigator.language || "en-US";
    u.rate = 0.95;
    u.onend = () => setOn(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setOn(true);
  };
  return (
    <button type="button" onClick={read} aria-pressed={on} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs text-plum hover:border-plum">
      {on ? <Square className="size-3" /> : <Volume2 className="size-4" />} {on ? "Stop" : "Read aloud"}
    </button>
  );
}

// ---- The goal page: last page of the book ----
const WEEK_MS = 7 * DAY;

function GoalLeft({ image, reveal, scans }: { image?: string; reveal: boolean; scans: SkinProfile[] }) {
  const [making, setMaking] = useState(false);
  // Render the goal from the first scan with a photo: the true starting point.
  const base = scans.find((s) => s.photo) ?? scans[0];
  return (
    <div className="grid h-full place-items-center p-10 text-center">
      <div>
        <span className={TAG}>My goal</span>
        <div className="relative mx-auto mt-5 w-56 rotate-2 bg-white p-3 pb-12 shadow-card">
          <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 bg-rose/35" />
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="My goal skin" className={`aspect-[3/4] w-full object-cover transition ${reveal ? "" : "blur-md"}`} />
          ) : (
            <div className="grid aspect-[3/4] w-full place-items-center border-2 border-dashed border-plum/30 bg-blush-50 p-4 text-xs text-muted">
              <span>
                Missed your goal picture? Make it from your first scan.
                {base && (
                  <button onClick={() => setMaking(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2 text-xs font-medium text-white">
                    <ScanFace className="size-3.5" /> Make my goal picture
                  </button>
                )}
              </span>
            </div>
          )}
          <p className="absolute inset-x-0 bottom-3 text-center font-display text-sm text-plum-deep">where I&apos;m heading</p>
        </div>
        {image && base && (
          <button onClick={() => setMaking(true)} className="mt-4 text-xs text-muted underline hover:text-plum">
            Make a new goal picture
          </button>
        )}
        {making && base && <FirstGoalReveal scan={base} manual onClose={() => setMaking(false)} />}
      </div>
    </div>
  );
}

function GoalRight({ scans, onNewGoal }: { scans: SkinProfile[]; onNewGoal: () => void }) {
  const { goal, setGoal } = useStore();
  if (!goal) {
    return (
      <div className="flex h-full flex-col justify-center gap-4 bg-blush-50/40 p-10">
        <p className="font-display text-3xl text-ink">No goal yet</p>
        <p className="text-sm text-muted">Pick one thing to improve. Your scans will track it here, week by week.</p>
        <button onClick={onNewGoal} className="self-start rounded-full bg-plum-deep px-6 py-3 text-sm font-medium text-white">Set my goal</button>
      </div>
    );
  }
  const setAt = new Date(goal.setAt).getTime();
  const planned = Math.max(1, Math.round((new Date(goal.by).getTime() - setAt) / WEEK_MS));
  const elapsed = Math.max(0, Math.floor((Date.now() - setAt) / WEEK_MS));
  // Only scans taken after the goal was set can confirm it.
  const since = scans.filter((s) => new Date(s.capturedAt).getTime() > setAt + 60 * 60 * 1000);
  const now = scans[scans.length - 1].scores[goal.concern];
  const span = goal.target - goal.from || 1;
  const pct = Math.max(0, Math.min(1, (now - goal.from) / span));
  const hit = since.find((s) => s.scores[goal.concern] >= goal.target);
  const hitWeeks = hit ? Math.max(1, Math.ceil((new Date(hit.capturedAt).getTime() - setAt) / WEEK_MS)) : null;
  const reached = Boolean(goal.reachedAt);
  const taken = goal.weeksTaken ?? hitWeeks ?? Math.max(1, elapsed);
  const gained = now - goal.from;
  const pace = elapsed > 0 ? gained / elapsed : 0;
  const left = Math.max(0, goal.target - now);
  const eta = pace > 0.2 ? Math.ceil(left / pace) : null;
  const late = !reached && elapsed > planned;
  const label = CONCERNS[goal.concern].label;
  const weeksWord = (n: number) => `${n} week${n === 1 ? "" : "s"}`;

  const markReached = () => {
    if (!hitWeeks) return;
    const weeksTaken = hitWeeks;
    setGoal({ ...goal, reachedAt: new Date().toISOString(), weeksTaken });
    const diff = weeksTaken - planned;
    const vs = diff < 0 ? `, ${weeksWord(-diff)} faster than planned` : diff > 0 ? ". Slow and steady still counts" : ", right on plan";
    celebrate("Goal reached!", `${label} in ${weeksWord(weeksTaken)}${vs}.`, "🏆");
  };

  return (
    <div className="flex h-full flex-col gap-4 bg-blush-50/40 p-8 lg:p-10">
      <p className="font-display text-3xl text-ink"><span className={MARK}>{reached ? "I did it." : "My goal"}</span></p>
      <div className="rounded-2xl bg-surface p-4">
        <p className="text-sm"><b className="font-medium">{label}</b> {goal.from} → {goal.target}</p>
        <p className="text-xs text-muted">Set {SHORT.format(new Date(goal.setAt))} · planned {weeksWord(planned)} · now in week {elapsed + 1}</p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-blush-100">
          <motion.div className={`h-full rounded-full ${reached || pct >= 1 ? "bg-good" : "bg-plum"}`} initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.9 }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">Latest scan: {now} ({Math.abs(gained)} {gained >= 0 ? "better" : "worse"} since you set it)</p>
      </div>

      {reached ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            [`${taken} wk`, "to reach it"],
            [`${taken - planned > 0 ? "+" : ""}${taken - planned} wk`, taken <= planned ? "vs plan, ahead" : "vs plan"],
            [`+${Math.max(0, gained)}`, `${label.toLowerCase()} points better`],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-surface p-3">
              <p className="font-display text-2xl text-plum-deep">{v}</p>
              <p className="text-[11px] text-muted">{l}</p>
            </div>
          ))}
          <button onClick={onNewGoal} className="col-span-3 mt-1 rounded-full bg-plum-deep py-3 text-sm font-medium text-white">Set my next goal</button>
          <button onClick={() => setGoal({ ...goal, reachedAt: undefined, weeksTaken: undefined })} className="col-span-3 text-xs text-muted underline">Undo, not reached yet</button>
        </div>
      ) : (
        <>
          {hit && <p className="rounded-2xl bg-good-soft p-3 text-sm text-good">Your scans say you hit {goal.target} in week {hitWeeks}. Tick it off!</p>}
          {late && !hit && (
            <div className="rounded-2xl border border-rose/30 bg-blush-100 p-4 text-sm text-plum-deep">
              <p className="font-medium">Taking longer than planned is normal.</p>
              <p className="mt-1 text-xs">
                You are {left} point{left === 1 ? "" : "s"} away{eta ? `, and at your pace you will get there in about ${weeksWord(eta)}` : ""}. Skin renews about every 4 to 6 weeks, so steady beats fast.
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Tick your plan at least 5 days a week. Consistency moves scores most.</li>
                <li>• <Link href="/routine" className="underline">Check your plan</Link> for a product that targets {label.toLowerCase()}.</li>
              </ul>
            </div>
          )}
          {!late && !hit && <p className="text-sm text-muted">{left} point{left === 1 ? "" : "s"} to go, {weeksWord(Math.max(0, planned - elapsed))} left in your plan. You are on track.</p>}
          <button onClick={markReached} disabled={!hitWeeks} className="mt-auto flex items-center gap-3 rounded-2xl border-2 border-dashed border-plum/40 p-4 text-start transition hover:border-plum disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-plum/40">
            <span className={`grid size-7 place-items-center rounded-md border-2 ${hitWeeks ? "border-good bg-good-soft" : "border-plum/50"}`} />
            <span>
              <span className="block text-sm font-medium">I reached my goal</span>
              <span className="text-xs text-muted">{hitWeeks ? "Your scans confirm it. Tick it to see your stats." : "Unlocks when a weekly check-in shows you hit the target."}</span>
            </span>
          </button>
          <div className="flex gap-4 text-xs">
            <button onClick={onNewGoal} className="text-plum underline">Change goal</button>
            <button onClick={() => setGoal(null)} className="text-muted underline hover:text-bad">Remove goal</button>
          </div>
        </>
      )}
    </div>
  );
}

// ---- Long-term goal: realistic timeline and target ----
const GOAL_WEEKS = [6, 8, 12];
// Skin turns over every 4 to 6 weeks; a scan moves a few points a month at best.
export function realisticTarget(concern: ConcernKey, routine: RoutineItem[], from: number, weeks: number) {
  const perWeek = weeklyGain(concern, routine).gain; // 2..5, from the products in your plan
  const total = Math.max(4, Math.min(15, Math.round(perWeek * weeks * 0.5)));
  return Math.min(100, from + total);
}

function LongGoalDialog({ latest, routine, onClose }: { latest: SkinProfile; routine: RoutineItem[]; onClose: () => void }) {
  const { goal, setGoal } = useStore();
  const weakest = [...CONCERN_KEYS].sort((a, b) => latest.scores[a] - latest.scores[b]).slice(0, 3);
  const [concern, setConcern] = useState<ConcernKey>(goal?.concern ?? weakest[0]);
  const [weeks, setWeeks] = useState(6);
  const from = latest.scores[concern];
  const target = realisticTarget(concern, routine, from, weeks);
  const save = () => {
    const now = Date.now();
    setGoal({ concern, from, target, setAt: new Date(now).toISOString(), by: new Date(now + weeks * WEEK_MS).toISOString() });
    onClose();
    chime();
  };
  return (
    <motion.div className="absolute inset-0 z-20 grid place-items-center bg-plum-deep/20 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-label="Set my goal" onClick={(e) => e.stopPropagation()} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-w-md rounded-[2rem] border border-line bg-surface p-6 text-ink shadow-soft">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 rounded-full p-1.5 text-muted hover:text-plum"><X className="size-4" /></button>
        <p className="font-display text-3xl">{goal ? "Change my goal" : "Set my goal"}</p>
        <p className="mt-1 text-sm text-muted">One area, a realistic target and enough time for skin to actually change.</p>
        <p className={`mt-5 ${TAG}`}>Improve</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {weakest.map((k) => (
            <button key={k} onClick={() => setConcern(k)} aria-pressed={concern === k} className={`rounded-full border-2 px-4 py-1.5 text-sm ${concern === k ? "border-plum bg-plum text-white" : "border-plum/25 hover:border-plum"}`}>
              {CONCERNS[k].label} <span className="opacity-70">{latest.scores[k]}</span>
            </button>
          ))}
        </div>
        <p className={`mt-5 ${TAG}`}>Over</p>
        <div className="mt-2 flex gap-2">
          {GOAL_WEEKS.map((w) => (
            <button key={w} onClick={() => setWeeks(w)} aria-pressed={weeks === w} className={`flex-1 rounded-2xl border-2 py-2 text-sm ${weeks === w ? "border-plum bg-blush-100 text-plum-deep" : "border-line"}`}>
              {w} weeks{w === 6 && <span className="block text-[10px] text-muted">recommended</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-blush-50 p-4 text-sm">
          Target: <b className="font-display text-xl">{from} → {target}</b>
          <p className="mt-1 text-xs text-muted">Skin renews every 4 to 6 weeks, so real change shows from week 3 or 4. This target is sized to the products in your plan and the time you picked.</p>
        </div>
        <button onClick={save} className="mt-5 w-full rounded-full bg-plum-deep py-3 text-sm font-medium text-white hover:bg-plum">{goal ? "Update my goal" : "Set my goal"}</button>
      </motion.div>
    </motion.div>
  );
}
