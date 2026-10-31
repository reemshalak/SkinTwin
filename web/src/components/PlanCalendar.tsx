"use client";

import { locale } from "@/lib/i18n-core";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Trash2, ChevronLeft, ChevronRight, AlertTriangle, Cloud, Droplets, FlaskConical, Leaf, Moon, Palette, Pipette, RotateCcw, Sparkles, Sun, X, Zap } from "lucide-react";
import { DAYS, isStrong, itemsFor, planWeek } from "@/lib/planner";
import { productById } from "@/lib/products";
import { chime } from "@/lib/sound";
import { useStore } from "@/lib/store";
import type { Product, RoutineItem, Scores } from "@/lib/types";

type Slot = "am" | "pm";
export type Schedule = { am: string[]; pm: string[] }[]; // index 0 = Monday

function autoSchedule(routine: RoutineItem[], scores?: Scores): Schedule {
  const week = planWeek(routine, scores);
  const am = routine.filter((r) => r.slot === "am").map((r) => r.productId);
  return DAYS.map((_, d) => ({ am: [...am], pm: itemsFor(routine, week, d, "pm").map((r) => r.productId) }));
}

// Your week, starting from the auto plan; your drags are kept on this device.
export function useSchedule(routine: RoutineItem[], scores?: Scores) {
  const key = `skintwin:schedule:${routine.map((r) => `${r.productId}.${r.slot}`).sort().join(",")}`;
  const auto = useMemo(() => autoSchedule(routine, scores), [routine, scores]);
  const [custom, setCustom] = useState<Schedule | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setCustom(raw ? (JSON.parse(raw) as Schedule) : null);
    } catch {
      setCustom(null);
    }
  }, [key]);
  const set = (s: Schedule | null) => {
    setCustom(s);
    try {
      if (s) localStorage.setItem(key, JSON.stringify(s));
      else localStorage.removeItem(key);
    } catch {}
  };
  return { schedule: custom ?? auto, setSchedule: set, edited: Boolean(custom) };
}

const CAT_ICON: Record<Product["category"], typeof Sun> = {
  cleanser: Droplets,
  exfoliant: Sparkles,
  serum: Pipette,
  moisturizer: Cloud,
  sunscreen: Sun,
  treatment: Zap,
  makeup: Palette,
};
const short = (id: string) => productById(id)?.name.split(" ").slice(0, 3).join(" ") ?? id;
const clashes = (ids: string[]) => ids.filter(isStrong).length > 1;
const MARK = "bg-gradient-to-b from-transparent from-55% to-rose/35 to-55% px-0.5";
const TAG = "inline-block -rotate-1 rounded-sm bg-blush-200/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-plum-deep";

// A product as a planner sticker.
function Sticker({ id, tilt = 0, small, onRemove }: { id: string; tilt?: number; small?: boolean; onRemove?: () => void }) {
  const p = productById(id);
  if (!p) return null;
  const Icon = CAT_ICON[p.category];
  const strong = isStrong(id);
  return (
    <span
      style={{ rotate: `${tilt}deg` }}
      className={`group relative flex items-center gap-2 rounded-xl border bg-surface pe-2 shadow-sm transition ${small ? "p-1 text-[11px]" : "p-1.5 text-xs"} ${strong ? "border-plum/60" : "border-line"}`}
      title={p.name}
    >
      <span className={`grid shrink-0 place-items-center rounded-lg bg-gradient-to-br ${p.hue} ${small ? "size-6" : "size-8"} ${strong ? "text-plum-deep" : "text-plum"}`}>
        <Icon className={small ? "size-3.5" : "size-4"} />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="line-clamp-2 text-ink">{short(id)}</span>
        {strong && !small && <span className="text-[9px] font-medium uppercase tracking-wider text-plum">strong</span>}
      </span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${p.name}`}
          className="absolute -top-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-surface text-muted opacity-0 shadow-card transition group-hover:opacity-100 hover:text-bad focus:opacity-100"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export function PlanCalendar({ routine, schedule, setSchedule, edited, today, readOnly }: { routine: RoutineItem[]; schedule: Schedule; setSchedule: (s: Schedule | null) => void; edited: boolean; today: number; readOnly?: boolean }) {
  const [picked, setPicked] = useState<string | null>(null); // tap-to-place on phones
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState<string | null>(null);
  const [day, setDay] = useState(today);
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set()); // "day|slot|productId"
  const toggleSel = (k: string) => setSel((cur) => {
    const n = new Set(cur);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    return n;
  });
  const allKeys = () => schedule.flatMap((x, d) => (["am", "pm"] as const).flatMap((slot) => x[slot].map((p) => `${d}|${slot}|${p}`)));
  const removeSelected = () => {
    setSchedule(schedule.map((x, d) => ({ am: x.am.filter((p) => !sel.has(`${d}|am|${p}`)), pm: x.pm.filter((p) => !sel.has(`${d}|pm|${p}`)) })));
    setSel(new Set());
    setSelecting(false);
  };
  const [offset, setOffset] = useState(0); // 0 = this week, -1 = last week…
  const { done } = useStore();
  const past = offset < 0;
  const locked = readOnly || past;
  const products = Array.from(new Set(routine.map((r) => r.productId)));
  const monday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - today + offset * 7);
    return d;
  }, [today, offset]);
  const dayKey = (i: number) => dateOf(i).toISOString().slice(0, 10);
  const dateOf = (i: number) => new Date(monday.getTime() + i * 86_400_000);
  const armed = dragging || Boolean(picked);

  const place = (id: string, d: number, slot: Slot, from?: { d: number; slot: Slot }) => {
    const next = schedule.map((x) => ({ am: [...x.am], pm: [...x.pm] }));
    if (from) next[from.d][from.slot] = next[from.d][from.slot].filter((p) => p !== id);
    if (!next[d][slot].includes(id)) next[d][slot].push(id);
    setSchedule(next);
    setDay(d);
    chime();
  };
  const remove = (id: string, d: number, slot: Slot) => setSchedule(schedule.map((x, i) => (i === d ? { ...x, [slot]: x[slot].filter((p) => p !== id) } : x)));

  const Zone = ({ d, slot }: { d: number; slot: Slot }) => {
    const ids = schedule[d][slot];
    const key = `${d}-${slot}`;
    const bad = slot === "pm" && clashes(ids);
    return (
      <div
        onDragOver={(e) => {
          if (locked) return;
          e.preventDefault();
          setOver(key);
        }}
        onDragLeave={() => setOver((o) => (o === key ? null : o))}
        onDrop={(e) => {
          e.preventDefault();
          setOver(null);
          setDragging(false);
          const [pid, fd, fs] = e.dataTransfer.getData("text/plain").split("|");
          if (pid) place(pid, d, slot, fd ? { d: Number(fd), slot: fs as Slot } : undefined);
        }}
        onClick={(e) => {
          if (!picked) return;
          e.stopPropagation();
          place(picked, d, slot);
          setPicked(null);
        }}
        className={`relative flex min-h-24 flex-col gap-1.5 rounded-2xl p-1.5 transition ${
          over === key ? "scale-[1.02] bg-plum/15 ring-2 ring-plum" : armed && !locked ? "bg-blush-50 outline-2 outline-dashed outline-plum/40" : bad ? "bg-bad-soft" : ""
        } ${picked ? "cursor-copy" : ""}`}
      >
        <span className="flex items-center gap-1 px-1 text-[10px] font-medium uppercase tracking-wider text-muted">
          {slot === "am" ? <Sun className="size-3 text-warn" /> : <Moon className="size-3 text-plum" />} {slot === "am" ? "Morning" : "Evening"}
          {bad && <AlertTriangle className="ms-auto size-3 text-bad" />}
        </span>
        <AnimatePresence initial={false}>
          {ids.map((pid, i) => (
            <motion.div key={pid} layout initial={{ scale: 0.5, opacity: 0, y: -10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
              <div
                draggable={!locked && !selecting}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", `${pid}|${d}|${slot}`);
                  setDragging(true);
                }}
                onDragEnd={() => setDragging(false)}
                onClick={(e) => {
                  if (!selecting) return;
                  e.stopPropagation();
                  toggleSel(`${d}|${slot}|${pid}`);
                }}
                data-selected={sel.has(`${d}|${slot}|${pid}`) || undefined}
                className={`relative ${locked ? "" : "cursor-grab active:cursor-grabbing"}`}
              >
                <Sticker id={pid} small tilt={selecting ? 0 : ((d + i) % 3) - 1} onRemove={locked || selecting ? undefined : () => remove(pid, d, slot)} />
                {selecting && (
                  <span className={`absolute inset-0 grid place-items-end rounded-xl p-1 transition ${sel.has(`${d}|${slot}|${pid}`) ? "bg-plum/25 ring-2 ring-plum" : "hover:bg-plum/10"}`}>
                    <span className={`grid size-4 place-items-center rounded-full border-2 text-[9px] ${sel.has(`${d}|${slot}|${pid}`) ? "border-plum bg-plum text-white" : "border-plum/50 bg-surface"}`}>{sel.has(`${d}|${slot}|${pid}`) ? "✓" : ""}</span>
                  </span>
                )}
                {(done[`${dayKey(d)}:${slot}`] ?? []).includes(pid) && <span className="absolute -top-1.5 -start-1.5 grid size-4 place-items-center rounded-full bg-good text-[9px] text-white shadow">✓</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!ids.length && <span className="grid flex-1 place-items-center rounded-xl border border-dashed border-line text-[10px] text-muted/70">{armed && !locked ? "Drop here" : "empty"}</span>}
      </div>
    );
  };

  const am = schedule[day].am;
  const pm = schedule[day].pm;
  const strongTonight = pm.filter(isStrong);
  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className={TAG}>My planner</span>
          <h2 className="mt-1 font-display text-3xl text-ink">
            <span className={MARK}>{offset === 0 ? "This week" : offset === -1 ? "Last week" : `${-offset} weeks ago`}</span>{" "}
            <span className="text-lg text-muted">
              {dateOf(0).toLocaleDateString(locale(), { day: "numeric", month: "short" })} – {dateOf(6).toLocaleDateString(locale(), { day: "numeric", month: "short" })}
            </span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex overflow-hidden rounded-full border border-line bg-surface text-plum">
            <button onClick={() => setOffset((o) => o - 1)} aria-label="Previous week" className="px-3 py-2 hover:bg-blush-50"><ChevronLeft className="size-4 rtl:rotate-180" /></button>
            <button onClick={() => setOffset(0)} disabled={offset === 0} className="border-x border-line px-3 text-xs disabled:text-muted">This week</button>
            <button onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset === 0} aria-label="Next week" className="px-3 py-2 hover:bg-blush-50 disabled:opacity-30"><ChevronRight className="size-4 rtl:rotate-180" /></button>
          </span>
          <Link href="/mix" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-xs text-plum hover:border-plum">
            <FlaskConical className="size-3.5" /> Preview this combo
          </Link>
          {!locked && !selecting && (
            <button onClick={() => setSelecting(true)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-xs text-plum hover:border-plum">
              <CheckSquare className="size-3.5" /> Select
            </button>
          )}
          {edited && !readOnly && (
            <button onClick={() => setSchedule(null)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-xs text-muted hover:text-plum">
              <RotateCcw className="size-3.5" /> Reset to suggested
            </button>
          )}
        </div>
      </div>

      {past && <p className="mb-4 rounded-2xl bg-blush-50 p-3 text-xs text-muted">Looking back: green ✓ marks the steps you ticked off that day. Go to this week to make changes.</p>}
      <AnimatePresence>
        {selecting && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="sticky top-20 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-full border border-plum/30 bg-surface/95 p-2 shadow-soft backdrop-blur">
            <span className="px-2 text-xs text-muted">{sel.size ? `${sel.size} selected` : "Tap entries to select"}</span>
            <button onClick={() => setSel(new Set(allKeys()))} className="rounded-full border border-line px-3 py-1.5 text-xs text-plum hover:border-plum">Select all</button>
            {sel.size > 0 && <button onClick={() => setSel(new Set())} className="rounded-full px-3 py-1.5 text-xs text-muted hover:text-plum">Clear selection</button>}
            <button onClick={removeSelected} disabled={!sel.size} className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-bad px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40">
              <Trash2 className="size-3.5" /> Remove {sel.size || ""}
            </button>
            <button onClick={() => { setSelecting(false); setSel(new Set()); }} className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">Done</button>
          </motion.div>
        )}
      </AnimatePresence>
      {!locked && !selecting && (
        <div className="mb-4 rounded-[1.75rem] border-2 border-dashed border-plum/25 bg-blush-50/60 p-4">
          <p className="mb-3 text-xs text-muted">
            <span className={`font-medium text-ink ${MARK}`}>The products in your plan.</span> Want to use one on another day, or move it from evening to morning? Drag it onto that slot, or tap it then tap the slot. Strong actives work best one per evening.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {products.map((pid, i) => (
              <motion.div
                key={pid}
                whileHover={{ y: -3, rotate: i % 2 ? 2 : -2 }}
                animate={picked === pid ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
                className={`w-44 rounded-xl ${picked === pid ? "ring-2 ring-plum ring-offset-2 ring-offset-blush-50" : ""}`}
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", `${pid}||`);
                    setDragging(true);
                  }}
                  onDragEnd={() => setDragging(false)}
                  onClick={() => setPicked(picked === pid ? null : pid)}
                  role="button"
                  aria-pressed={picked === pid}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <Sticker id={pid} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Day cards */}
      <div className="-mx-5 overflow-x-auto px-5 pt-4 pb-3 lg:mx-0 lg:px-1">
        <ol className="grid min-w-[60rem] grid-cols-7 gap-3">
          {DAYS.map((d, i) => {
            const isToday = offset === 0 && i === today;
            const rest = !schedule[i].pm.some(isStrong);
            const done = offset < 0 || i < today;
            return (
              <motion.li
                key={d}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setDay(i)}
                className={`relative flex cursor-pointer flex-col gap-1 rounded-[1.5rem] border p-2.5 shadow-card transition hover:-translate-y-0.5 ${
                  day === i ? "border-plum bg-surface" : "border-line bg-surface/80"
                } ${done ? "opacity-70" : ""}`}
              >
                {isToday && <span aria-hidden className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-2 bg-rose/40" />}
                <div className="flex items-baseline justify-between px-1">
                  <span className={`text-[11px] font-medium uppercase tracking-wider ${isToday ? "text-plum" : "text-muted"}`}>{d}</span>
                  <span className={`font-display text-3xl leading-none ${isToday ? "text-plum-deep" : "text-ink"}`}>{dateOf(i).getDate()}</span>
                </div>
                <span className={`mx-1 mb-1 w-fit rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${isToday ? "bg-plum text-white" : rest ? "bg-good-soft text-good" : "bg-blush-100 text-plum"}`}>
                  {isToday ? "Today" : rest ? "Recovery" : "Active night"}
                </span>
                <Zone d={i} slot="am" />
                <div className="mx-2 border-t border-dashed border-line" />
                <Zone d={i} slot="pm" />
                {rest && <Leaf className="absolute end-2.5 bottom-2.5 size-3.5 text-good/60" />}
              </motion.li>
            );
          })}
        </ol>
      </div>

      {/* The selected day, as a journal note */}
      <AnimatePresence mode="wait">
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 8, rotate: -0.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="relative mt-3 grid gap-4 rounded-[1.75rem] border border-line bg-blush-50/50 p-5 md:grid-cols-[auto_1fr_1fr]"
        >
          <span aria-hidden className="absolute -top-2 start-10 h-4 w-14 -rotate-3 bg-rose/30" />
          <div>
            <span className={TAG}>{DAYS[day]} {dateOf(day).getDate()}</span>
            <p className="mt-2 max-w-[14rem] font-display text-xl leading-snug text-ink">
              {clashes(pm) ? (
                <span className="text-bad">Two strong actives tonight. Drag one to another evening.</span>
              ) : strongTonight.length ? (
                <>Active night: <span className={MARK}>{strongTonight.map(short).join("")}</span></>
              ) : (
                <>Recovery night. <span className={MARK}>Your skin repairs</span> while it rests.</>
              )}
            </p>
          </div>
          {([["am", am], ["pm", pm]] as const).map(([slot, ids]) => (
            <div key={slot}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                {slot === "am" ? <Sun className="size-3.5 text-warn" /> : <Moon className="size-3.5 text-plum" />} {slot === "am" ? "Morning, in order" : "Evening, in order"}
              </p>
              <ol className="space-y-1.5">
                {ids.map((pid, n) => (
                  <li key={pid} className="flex items-center gap-2 text-sm">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface text-[10px] text-muted">{n + 1}</span>
                    <Link href={`/product/${pid}`} className="truncate hover:text-plum">{productById(pid)?.name}</Link>
                  </li>
                ))}
                {!ids.length && <li className="text-xs text-muted">Nothing planned</li>}
              </ol>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
