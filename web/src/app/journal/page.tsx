"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Lock, ScanFace, Trash2 } from "lucide-react";
import { GoalCard } from "@/components/GoalCard";
import { EASE } from "@/components/motion";
import { NeedScan } from "@/components/NeedScan";
import { Page, PageTitle } from "@/components/Page";
import { Delta } from "@/components/ui";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { sampleById } from "@/lib/samples";
import { mockYouCamResponse, profileFromYouCam, progressedScores } from "@/lib/skin-analysis";
import { useStore } from "@/lib/store";
import type { SkinProfile } from "@/lib/types";

const DATE = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

function Trend({ scans }: { scans: SkinProfile[] }) {
  const vals = scans.map((s) => s.overall);
  const lo = Math.min(...vals) - 3;
  const hi = Math.max(...vals) + 3;
  const w = 240;
  const h = 56;
  const x = (i: number) => (vals.length === 1 ? w / 2 : (i * w) / (vals.length - 1));
  const y = (v: number) => h - ((v - lo) / (hi - lo || 1)) * h;
  return (
    <svg viewBox={`-6 -6 ${w + 12} ${h + 12}`} className="h-16 w-full max-w-xs" role="img" aria-label={`Skin score from ${vals[0]} to ${vals[vals.length - 1]}`}>
      <path d={vals.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="currentColor" />
      ))}
    </svg>
  );
}

export default function JournalPage() {
  const { ready, scans, deleteScan, updateScan, setScans } = useStore();
  const [reveal, setReveal] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  if (!ready) return null;
  if (!scans.length) return <NeedScan what="your skin journal" />;

  const entries = [...scans].reverse();

  // Demo helper for videos: four simulated weekly check-ins after the latest scan.
  function addSampleWeeks() {
    const base = scans[scans.length - 1];
    const focus = [...CONCERN_KEYS].sort((a, b) => base.scores[a] - base.scores[b]).slice(0, 3);
    const start = new Date(base.capturedAt).getTime();
    const weeks = [1, 2, 3, 4].map((wk) => ({
      ...profileFromYouCam(mockYouCamResponse(progressedScores(base.scores, wk, focus)), { source: "mock" as const, sampleId: base.sampleId }),
      photo: base.photo,
      capturedAt: new Date(start + wk * 7 * 86_400_000).toISOString(),
    }));
    setScans([...scans, ...weeks]);
  }
  const first = scans[0];
  const last = scans[scans.length - 1];
  const change = last.overall - first.overall;

  return (
    <Page>
      <PageTitle
        eyebrow="Journal"
        title="Your skin journal"
        subtitle="One check-in a week, same light, same spot. Small changes add up here even when the mirror can't show them."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReveal((v) => !v)}
              aria-pressed={reveal}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-plum"
            >
              {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {reveal ? "Hide photos" : "Show photos"}
            </button>
            <Link href="/scan" className="inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-5 py-2.5 text-sm font-medium text-white">
              <ScanFace className="size-4" /> Weekly check-in
            </Link>
          </div>
        }
      />

      {scans.length > 1 && (
        <Link href="/week" className="mb-6 flex items-center gap-3 rounded-[2rem] border border-line bg-surface p-4 text-sm transition hover:shadow-card">
          <span className="grid size-10 place-items-center rounded-full bg-blush-100 text-plum">✦</span>
          <span className="flex-1">
            <span className="block font-medium">This week&apos;s check-in</span>
            <span className="text-xs text-muted">What changed, what&apos;s working, and your pace vs your twins</span>
          </span>
          <span className="text-plum">→</span>
        </Link>
      )}

      <GoalCard />

      {scans.length > 1 && (
        <section className="glow-card mb-10 flex flex-wrap items-center justify-between gap-6 rounded-[2rem] p-6 text-white shadow-soft">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Since your first check-in</p>
            <p className="font-display text-4xl">
              {change >= 0 ? "+" : ""}
              {change} <span className="text-xl opacity-90">points</span>
            </p>
            <p className="text-sm opacity-90">
              {scans.length} check-ins · {first.overall} → {last.overall}
            </p>
          </div>
          <div className="text-white/90">
            <Trend scans={scans} />
          </div>
        </section>
      )}

      <p className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Lock className="size-3.5" /> Only you can see this journal. Photos stay on this device.
      </p>

      <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {entries.map((s, i) => {
            const prev = entries[i + 1];
            const photo = s.photo ?? (s.sampleId ? sampleById(s.sampleId)?.image : undefined);
            const repeat = prev && s.photoHash && prev.photoHash === s.photoHash;
            const moves = prev
              ? CONCERN_KEYS.map((k) => ({ k, d: s.scores[k] - prev.scores[k] }))
                  .filter((m) => Math.abs(m.d) >= 1)
                  .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
                  .slice(0, 3)
              : [];
            return (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, ease: EASE }}
                className={`${TILTS[i % TILTS.length]} transition hover:rotate-0`}
              >
                <article className="rounded-xl bg-surface p-3 pb-4 shadow-soft">
                  <Link href={`/analysis?scan=${s.id}`} className="relative block aspect-square overflow-hidden rounded-md bg-blush-100" aria-label="Open this check-in's skin map">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className={`h-full w-full object-cover transition duration-500 ${reveal ? "" : "scale-110 blur-xl"}`} />
                    ) : (
                      <span className="grid h-full place-items-center text-xs text-muted">Photo removed</span>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2.5 py-1 font-display text-lg text-plum-deep">{s.overall}</span>
                    {!reveal && photo && <span className="absolute top-2 right-2 rounded-full bg-ink/40 px-2 py-0.5 text-[10px] text-white backdrop-blur">Private</span>}
                  </Link>
                  <div className="mt-3 flex items-baseline justify-between px-1">
                    <p className="font-display text-lg">{i === entries.length - 1 ? "First scan" : `Week ${entries.length - 1 - i}`}</p>
                    <p className="text-xs text-muted">{DATE.format(new Date(s.capturedAt))}</p>
                  </div>
                  {prev && (
                    <p className="mt-1 px-1 text-xs">
                      <Delta value={s.overall - prev.overall} /> <span className="text-muted">since last check-in</span>
                    </p>
                  )}
                  {moves.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-x-3 px-1 text-[11px] text-muted">
                      {moves.map(({ k, d }) => (
                        <span key={k}>
                          {CONCERNS[k].label} <Delta value={d} />
                        </span>
                      ))}
                    </p>
                  )}
                  {repeat && (
                    <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-warn-soft px-2 py-1.5 text-[11px] text-warn">
                      <AlertTriangle className="size-3.5" /> Same photo as the check-in before
                    </p>
                  )}
                  <textarea
                    defaultValue={s.note}
                    onBlur={(e) => e.target.value !== (s.note ?? "") && updateScan(s.id, { note: e.target.value })}
                    placeholder="Add a note: new product, breakout, travel…"
                    rows={2}
                    aria-label="Journal note"
                    className="mt-3 w-full resize-none rounded-lg bg-blush-50 px-3 py-2 font-display text-sm italic outline-none placeholder:not-italic placeholder:font-sans placeholder:text-xs placeholder:text-muted focus:ring-1 focus:ring-plum"
                  />
                  <div className="mt-2 flex justify-end px-1">
                    {confirm === s.id ? (
                      <span className="flex items-center gap-2 text-xs">
                        Delete this check-in?
                        <button onClick={() => { deleteScan(s.id); setConfirm(null); }} className="rounded-full bg-bad px-3 py-1 text-white">Delete</button>
                        <button onClick={() => setConfirm(null)} className="rounded-full border border-line px-3 py-1">Keep</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirm(s.id)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-bad">
                        <Trash2 className="size-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </article>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      {scans.length < 3 && (
        <p className="mt-12 text-center text-xs text-muted">
          Demo:{" "}
          <button onClick={addSampleWeeks} className="text-plum underline">
            add 4 sample weeks
          </button>{" "}
          to preview how progress looks.
        </p>
      )}
    </Page>
  );
}
