"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, Bell, BellRing, CalendarClock, Droplets, Flame, Layers, Lock, ScanFace, Sparkles, Sun, Waves, Zap } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { NextStep } from "@/components/Journey";
import { EASE, GrowBar, Reveal } from "@/components/motion";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { FaceDiagram, Heatmap, Ring, severity } from "@/components/report/Visuals";
import { SaveProfile } from "@/components/SaveProfile";
import { CONCERN_KEYS, CONCERNS, skinTypeLabel } from "@/lib/concerns";
import { personAvatar } from "@/lib/people";
import { sampleById } from "@/lib/samples";
import { useStore } from "@/lib/store";
import type { ConcernKey } from "@/lib/types";
import { useTwins } from "@/lib/use-twins";

const DATE = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });

const ACTIONS: Record<ConcernKey, { title: string; text: string; icon: typeof Droplets }> = {
  moisture: { title: "Hydrate", text: "Hyaluronic acid on damp skin, sealed with a moisturiser.", icon: Droplets },
  oiliness: { title: "Balance oil", text: "Niacinamide and light, non-comedogenic textures.", icon: Waves },
  redness: { title: "Calm", text: "Ceramides, fewer actives, daily mineral SPF.", icon: Flame },
  texture: { title: "Exfoliate gently", text: "A mild acid once or twice a week.", icon: Layers },
  pore: { title: "Unclog pores", text: "Salicylic acid a few evenings a week.", icon: Zap },
  acne: { title: "Clear breakouts", text: "Spot-treat, don't over-dry the whole face.", icon: Sparkles },
  radiance: { title: "Brighten", text: "Vitamin C in the morning, under SPF.", icon: Sun },
  wrinkle: { title: "Smooth lines", text: "A retinoid at night and SPF every day.", icon: Sparkles },
};

const RING_KEYS: ConcernKey[] = ["moisture", "texture", "radiance", "redness"];

export default function ReportPage() {
  const { latest, ready, scans, reminders, setReminders } = useStore();
  const { twins, featured } = useTwins();
  const [heat, setHeat] = useState(true);
  if (!ready) return null;
  if (!latest) return <NeedScan what="your skin report" />;

  const photo = latest.photo ?? (latest.sampleId ? sampleById(latest.sampleId)?.image : undefined);
  const byConcern = [...CONCERN_KEYS].sort((a, b) => latest.scores[a] - latest.scores[b]);
  const focus = byConcern.slice(0, 3);
  const first = scans[0];
  const progress = latest.overall - first.overall;
  const nextCheck = new Date(new Date(latest.capturedAt).getTime() + 7 * 86_400_000);

  return (
    <Page className="!max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">Step 2 of 4 · Your results</p>
          <h1 className="mt-1 font-display text-3xl lg:text-4xl">
            {skinTypeLabel(latest.scores)} skin, <span className="text-plum">{latest.overall}/100</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/analysis" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-plum hover:shadow-card">
            <ScanFace className="size-4" /> Skin map
          </Link>
          <Link href="/twins" className="inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2.5 text-sm font-medium text-white">
            Meet my twins <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        {/* Photo with heatmap */}
        <Reveal className="relative self-start overflow-hidden rounded-[2rem] border border-line bg-surface lg:sticky lg:top-24">
          <div className="relative aspect-[4/5]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Your scan" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-blush-100 to-blush-200" />
            )}
            {heat && <Heatmap scores={latest.scores} keys={CONCERN_KEYS} />}
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-[11px] font-medium text-plum shadow-card">
              <span className={`size-1.5 rounded-full ${latest.source === "live" ? "bg-good" : "bg-rose"}`} />
              {latest.source === "live" ? "YouCam AI analysis" : "Demo analysis"}
            </span>
            <button
              onClick={() => setHeat((v) => !v)}
              aria-pressed={heat}
              className="absolute top-4 right-4 rounded-full bg-surface/90 px-3 py-1 text-[11px] text-plum shadow-card"
            >
              {heat ? "Hide heatmap" : "Show heatmap"}
            </button>
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-surface/90 p-3 shadow-card backdrop-blur">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#8ac26f] via-[#f4c27a] to-[#e84d5a]" />
              <div className="mt-1.5 flex justify-between text-[10px] text-muted">
                <span>Low concern</span>
                <span>High concern</span>
              </div>
            </div>
          </div>
          <p className="flex items-center gap-1.5 px-4 py-3 text-[11px] text-muted">
            <Lock className="size-3.5" /> Only you can see this photo.
          </p>
        </Reveal>

        <div className="space-y-5">
          {/* Overview rings */}
          <Reveal delay={0.05} className="rounded-[2rem] border border-line bg-surface p-5">
            <h2 className="text-base font-medium">Skin overview</h2>
            <p className="text-xs text-muted">Your skin health at a glance, higher is healthier</p>
            <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-5">
              <Ring value={latest.overall} label="Overall" i={0} />
              {RING_KEYS.map((k, i) => (
                <Ring key={k} value={latest.display[k]} label={CONCERNS[k].label} i={i + 1} />
              ))}
            </div>
          </Reveal>

          {/* Concerns + face chart */}
          <Reveal delay={0.1} className="grid gap-5 rounded-[2rem] border border-line bg-surface p-5 md:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="text-base font-medium">Skin concerns</h2>
              <p className="text-xs text-muted">Areas that need attention first</p>
              <ul className="mt-4 space-y-3.5">
                {byConcern.map((k, i) => {
                  const s = severity(latest.scores[k]);
                  return (
                    <li key={k}>
                      <Link href={`/report/${k}`} className="group block">
                        <div className="mb-1.5 flex items-baseline justify-between text-sm">
                          <span className="group-hover:text-plum">{CONCERNS[k].label}</span>
                          <span className="text-xs">
                            <span className={s.tone}>{s.label}</span> <span className="tabular-nums text-muted">{latest.display[k]}</span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-blush-100">
                          <GrowBar value={latest.display[k]} delay={i * 0.05} className="h-full rounded-full bg-gradient-to-r from-[#8b7ae0] via-[#e37ea5] to-[#f4c27a]" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-[14rem]">
              <FaceDiagram scores={latest.scores} />
            </div>
          </Reveal>

          {/* Recommendations */}
          <Reveal delay={0.15} className="rounded-[2rem] border border-line bg-surface p-5">
            <h2 className="text-base font-medium">What to do first</h2>
            <p className="text-xs text-muted">Personalised for your top concerns</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {focus.map((k, i) => {
                const a = ACTIONS[k];
                return (
                  <motion.div key={k} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, ease: EASE }}>
                    <Link href={`/report/${k}`} className="group flex h-full gap-3 rounded-2xl bg-blush-50 p-3 transition hover:bg-blush-100">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-plum shadow-card">
                        <a.icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{a.title}</span>
                        <span className="block text-[11px] leading-snug text-muted">{a.text}</span>
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </Reveal>

          {/* Progress + next check-in + twins */}
          <div className="grid gap-5 md:grid-cols-3">
            <Reveal className="rounded-[2rem] border border-line bg-surface p-5">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <CalendarClock className="size-4" /> Next check-in
              </p>
              <p className="mt-2 font-display text-xl">{DATE.format(nextCheck)}</p>
              <button
                onClick={() => setReminders(!reminders)}
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium ${reminders ? "bg-good-soft text-good" : "bg-plum-deep text-white"}`}
              >
                {reminders ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />} {reminders ? "Reminder on" : "Set reminder"}
              </button>
            </Reveal>
            <Reveal delay={0.05}>
              <Link href="/journal" className="block h-full rounded-[2rem] border border-line bg-surface p-5 transition hover:shadow-card">
                <p className="text-xs text-muted">Your progress</p>
                <p className={`mt-2 font-display text-3xl ${progress >= 0 ? "text-good" : "text-bad"}`}>
                  {scans.length > 1 ? `${progress >= 0 ? "+" : ""}${progress}` : "Start"}
                </p>
                <p className="text-[11px] text-muted">{scans.length > 1 ? `since your first scan · ${scans.length} check-ins` : "Check in weekly to see change"}</p>
              </Link>
            </Reveal>
            <Reveal delay={0.1}>
              <Link href="/twins" className="glow-card block h-full rounded-[2rem] p-5 text-white shadow-soft">
                <p className="text-xs opacity-85">People like you</p>
                <p className="mt-2 font-display text-3xl">{twins.length}</p>
                <span className="mt-2 flex -space-x-2">
                  {featured.slice(0, 4).map((t) => (
                    <Avatar key={t.member.id} config={personAvatar(t.member.personId!)} className="size-7 border-2 border-white/60 text-xs" />
                  ))}
                </span>
              </Link>
            </Reveal>
          </div>

          <SaveProfile />
        </div>
      </div>

      <NextStep href="/twins" label="Meet your skin twins" hint="See who has skin like yours and what measurably worked for them." />
    </Page>
  );
}
