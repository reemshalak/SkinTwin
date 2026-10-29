"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { SaveProfile } from "@/components/SaveProfile";
import { CONCERNS, scoreTone, skinTypeLabel } from "@/lib/concerns";
import { sampleById } from "@/lib/samples";
import { useStore } from "@/lib/store";
import type { ConcernKey, SkinProfile } from "@/lib/types";
import { patchStyle, ZONE_ORDER, ZONES } from "@/lib/zones";

const STEP_MS = 420;
const MIN_MS = ZONE_ORDER.length * STEP_MS + 700;

function status(p: SkinProfile, k: ConcernKey) {
  const t = scoreTone(p.scores[k]);
  return t === "low" ? CONCERNS[k].low : t === "good" ? CONCERNS[k].high : "Balanced";
}

function Segments({ value, live }: { value?: number; live: boolean }) {
  const filled = value === undefined ? 0 : Math.round(value / 10);
  return (
    <div className="mt-1.5 flex gap-0.5" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-2 rounded-[1px] transition-colors duration-500 ${
            value === undefined ? (live ? "animate-pulse bg-white/30" : "bg-white/20") : i < filled ? "bg-surface" : "bg-white/25"
          }`}
          style={{ transitionDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}

export default function AnalysisPage() {
  const router = useRouter();
  const { ready, pending, setPending, latest, scans, addScan, liveScans } = useStore();
  const [result, setResult] = useState<SkinProfile | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const started = useRef(false);

  // Run the pending scan once; otherwise show the latest saved one.
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    if (!pending) {
      const id = new URLSearchParams(window.location.search).get("scan");
      const chosen = (id && scans.find((x) => x.id === id)) || latest;
      if (chosen) {
        setResult(chosen);
        setRevealed(ZONE_ORDER.length);
      } else router.replace("/scan");
      return;
    }
    const { photo, photoHash, ...rest } = pending;
    const body = { ...rest, live: liveScans };
    const tick = setInterval(() => setRevealed((r) => Math.min(r + 1, ZONE_ORDER.length)), STEP_MS);
    Promise.all([
      fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(
        async (r) => {
          const json = (await r.json().catch(() => ({}))) as { profile?: SkinProfile; note?: string; error?: string };
          if (!r.ok || !json.profile) throw new Error(json.error ?? "The scan didn't go through. Please try again.");
          return json as { profile: SkinProfile; note?: string };
        },
      ),
      new Promise((r) => setTimeout(r, MIN_MS)),
    ])
      .then(([{ profile, note }]) => {
        setNote(note ?? null);
        const withPhoto = { ...profile, photo, photoHash };
        addScan(withPhoto);
        setResult(withPhoto);
        setRevealed(ZONE_ORDER.length);
        setPending(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => clearInterval(tick));
  }, [ready, pending, latest, scans, addScan, setPending, router, liveScans]);

  const photo = result?.photo ?? pending?.photo ?? (result?.sampleId ? sampleById(result.sampleId)?.image : undefined);
  const done = Boolean(result) && revealed >= ZONE_ORDER.length;
  const progress = done ? 100 : Math.min(96, Math.round((revealed / ZONE_ORDER.length) * 92));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink text-white">
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/20 to-ink/70" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col lg:flex-row lg:items-center lg:gap-10 lg:px-8">
        {/* Headline column */}
        <div className="z-10 px-5 pt-5 lg:w-80 lg:shrink-0 lg:px-0 lg:pt-0">
          <div className="flex items-center justify-between lg:mb-10">
            <Link href="/" className="font-display text-xl text-white/90">
              SkinTwin
            </Link>
            <Link href={done ? "/report" : "/scan"} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-white/10 backdrop-blur lg:hidden">
              <X className="size-4" />
            </Link>
          </div>
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="mt-4 lg:mt-0">
                <h1 className="font-display text-3xl leading-tight lg:text-5xl">
                  Skin intelligence
                  <br />
                  <em className="text-blush-200">loading…</em>
                </h1>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
                    <motion.div className="h-full bg-surface shadow-[0_0_12px_white]" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                  </div>
                  <span className="text-xs tabular-nums text-white/80">{progress}%</span>
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/60">Analysing 8 skin concerns · YouCam AI</p>
                {error && (
                  <p className="mt-4 text-sm text-blush-200">
                    {error}{" "}
                    <Link href="/scan" className="underline">
                      Back to scan
                    </Link>
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mt-4 lg:mt-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Your skin, mapped</p>
                <h1 className="mt-2 font-display text-3xl leading-tight lg:text-5xl">
                  {skinTypeLabel(result!.scores)} skin,
                  <br />
                  <em className="text-blush-200">scored {result!.overall}/100</em>
                </h1>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/85">
                  <span className={`size-1.5 rounded-full ${result!.source === "live" ? "bg-[#7cc6a0]" : "bg-blush-200"}`} />
                  {result!.source === "live" ? "Live YouCam analysis" : note ?? "Demo scores"}
                </p>
                <p className="mt-3 hidden text-sm leading-relaxed text-white/75 lg:block">
                  Tap any marker to see what it means, how you compare with your twins, and what helped them.
                </p>
                <div className="mt-5 hidden flex-col gap-2 lg:flex">
                  <Link href="/twins" className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-6 py-3.5 text-sm font-medium text-plum-deep">
                    Meet my skin twins <ArrowRight className="size-4" />
                  </Link>
                  <Link href="/report" className="rounded-full border border-white/30 px-6 py-3.5 text-center text-sm text-white/90 hover:bg-white/10">
                    Full report
                  </Link>
                  <SaveProfile tone="dark" className="mt-4" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Portrait with face-mapped labels */}
        <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center lg:mt-0 lg:h-[calc(100dvh-4rem)]">
          <div className="relative aspect-[4/5] h-full max-h-full max-w-full overflow-visible">
            <div className="absolute inset-0 overflow-hidden lg:rounded-[2rem]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your scanned photo" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-b from-blush-300 to-plum" />
              )}
              <div className="absolute inset-0 bg-ink/15" />
              {!done && <div className="animate-scanline absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-white/30 to-transparent" />}
            </div>

            {ZONE_ORDER.map((k, i) => {
              const z = ZONES[k];
              const shown = i < revealed;
              const value = done ? result!.display[k] : undefined;
              const card = (
                <div className="w-[8.5rem] rounded-lg border border-white/25 bg-ink/35 p-2 backdrop-blur-md sm:w-44 sm:p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/90 sm:text-[10px]">{CONCERNS[k].label}</p>
                      <p className="mt-0.5 truncate font-display text-xs italic text-white sm:text-sm">
                        {done ? status(result!, k) : "Measuring…"}
                      </p>
                      <Segments value={value} live={!done} />
                    </div>
                    {photo && (
                      <span className="hidden size-12 shrink-0 rounded-md border border-white/40 sm:block" style={patchStyle(photo, k)} aria-hidden />
                    )}
                  </div>
                </div>
              );
              return (
                <AnimatePresence key={k}>
                  {shown && (
                    <motion.div
                      className="absolute"
                      style={{ left: `${z.x}%`, top: `${z.y}%` }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      {/* Marker on the face */}
                      <span className="absolute -translate-x-1/2 -translate-y-1/2">
                        <span className="absolute inset-0 animate-ping rounded-full bg-surface/60" />
                        <span className="relative block size-2.5 rounded-full border-2 border-white bg-rose shadow-[0_0_10px_white]" />
                      </span>
                      {/* Leader line + label */}
                      {/* Phones: a small chip by the marker; the full cards sit below the photo */}
                      <span
                        className={`absolute top-0 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink/45 px-2 py-0.5 text-[10px] backdrop-blur-sm sm:hidden ${
                          z.side === "left" ? "right-3" : "left-3"
                        }`}
                      >
                        {CONCERNS[k].label}
                        {done && <b className="ml-1 font-medium">{result!.display[k]}</b>}
                      </span>
                      <div
                        className={`absolute top-0 hidden -translate-y-1/2 items-center sm:flex ${z.side === "left" ? "right-2 flex-row-reverse" : "left-2"}`}
                      >
                        <span className="h-px w-5 bg-surface/70 sm:w-10" />
                        {done ? (
                          <Link href={`/report/${k}`} aria-label={`${CONCERNS[k].label} details`} className="block transition hover:scale-[1.04]">
                            {card}
                          </Link>
                        ) : (
                          card
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        </div>

        {/* Phone: tappable cards + actions */}
        {done && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10 shrink-0 space-y-3 p-4 sm:hidden">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {ZONE_ORDER.map((k) => (
                <Link key={k} href={`/report/${k}`} className="w-32 shrink-0 rounded-xl border border-white/25 bg-white/10 p-2 backdrop-blur">
                  {photo && <span className="mb-1.5 block h-14 rounded-lg" style={patchStyle(photo, k)} aria-hidden />}
                  <p className="text-[9px] uppercase tracking-[0.16em] text-white/80">{CONCERNS[k].label}</p>
                  <p className="truncate font-display text-xs italic">{status(result!, k)}</p>
                  <Segments value={result!.display[k]} live={false} />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
        {done && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10 grid shrink-0 grid-cols-2 gap-2 p-4 pt-0 lg:hidden">
            <Link href="/report" className="rounded-full border border-white/30 py-3 text-center text-sm">
              Full report
            </Link>
            <Link href="/twins" className="rounded-full bg-surface py-3 text-center text-sm font-medium text-plum-deep">
              My twins
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
