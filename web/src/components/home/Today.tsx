"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowRight, CalendarHeart, Check, Coffee, Droplet, Flame, Lightbulb, MessagesSquare, Moon, ScanFace, Sun, Users } from "lucide-react";
import { circleOf } from "@/lib/circles";
import { tr, type TKey } from "@/lib/i18n";
import { useMyIdentity } from "../MyAvatar";
import { WriteOn } from "../WriteOn";
import { useT } from "@/lib/i18n";
import { FaceDiagram } from "../report/Visuals";
import { PostTile } from "../SocialFeed";
import { ProductThumb } from "../ui";
import { SAMPLE_POSTS } from "@/lib/community";
import { CONCERN_KEYS, CONCERNS, skinTypeLabel } from "@/lib/concerns";
import { itemsFor, planWeek, weekday } from "@/lib/planner";
import { productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { similarity, TWIN_THRESHOLD } from "@/lib/twins";
import { useTwins } from "@/lib/use-twins";
import { productCalls, streak } from "@/lib/week";
import type { ConcernKey } from "@/lib/types";

const DAY = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });
const SHORT = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const todayKey = () => new Date().toISOString().slice(0, 10);

// One practical tip a day, aimed at your weakest score.
const TIPS: Record<ConcernKey, string[]> = {
  moisture: ["Apply moisturiser on slightly damp skin to lock water in.", "Lukewarm, not hot, water keeps your barrier happier."],
  oiliness: ["Over-washing can make skin oilier. Twice a day is enough.", "Gel textures feel lighter on oily skin than rich creams."],
  redness: ["Patch-test new products behind the ear for 3 days.", "Fragrance-free products are kinder to reactive skin."],
  texture: ["Exfoliate 2 to 3 times a week, not daily.", "Consistency beats strength: gentle acids, used regularly."],
  pore: ["Pores look smaller when skin is clean and hydrated, not stripped.", "Salicylic acid works inside the pore; give it 4 weeks."],
  acne: ["Change your pillowcase twice a week.", "Don't pick: it doubles healing time and leaves marks."],
  radiance: ["Sleep is the cheapest glow. Aim for 7 to 9 hours.", "Daily SPF keeps dullness and dark spots from building up."],
  wrinkle: ["SPF every morning is the best anti-ageing step there is.", "Retinoids work slowly: judge them at 12 weeks."],
};
const CALL_LABEL = { working: "Working", keep: "Keep going", early: "Too early", pause: "Pause", swap: "Try a swap" } as const;

// Home for someone who has scanned: what to do today, at a glance.
export function Today() {
  const router = useRouter();
  const { latest, scans, routine, done, toggleDone, goal, wellness } = useStore();
  const { twins } = useTwins();
  const me = useMyIdentity();
  const { t } = useT();

  const posts = useMemo(() => {
    if (!latest) return [];
    return SAMPLE_POSTS.filter((p) => p.skin && similarity(latest.scores, p.skin) >= TWIN_THRESHOLD && p.personId !== latest.sampleId).slice(0, 3);
  }, [latest]);

  if (!latest) return null;
  const st = streak(scans);
  const next = new Date(new Date(latest.capturedAt).getTime() + 7 * 86_400_000);
  const focus = [...CONCERN_KEYS].sort((a, b) => latest.scores[a] - latest.scores[b]).slice(0, 2);
  const week = planWeek(routine, latest.scores);
  const steps = [...routine.filter((r) => r.slot === "am"), ...itemsFor(routine, week, weekday(), "pm")];
  const key = (slot: "am" | "pm") => `${todayKey()}:${slot}`;
  const doneCount = steps.filter((r) => done[key(r.slot)]?.includes(r.productId)).length;
  const calls = productCalls(routine, scans, twins);
  const dayNo = Math.floor(Date.now() / 86_400_000);
  const tip = TIPS[focus[0]][dayNo % TIPS[focus[0]].length];

  const circle = circleOf(latest.scores);
  const lead = calls.find((c) => c.call === "working") ?? calls[0];
  const goalNow = goal ? latest.scores[goal.concern] : 0;
  const goalPct = goal ? Math.max(0, Math.min(1, (goalNow - goal.from) / ((goal.target - goal.from) || 1))) : 0;

  // One next action, whichever matters most right now.
  const nextStep = st.due
    ? { title: t("today.due"), sub: t("n.checkin.b"), href: "/scan", cta: t("today.checkNow") }
    : steps.length > doneCount
      ? { title: t("n.left", { n: steps.length - doneCount }), sub: "", href: "#today", cta: t("today.routine") }
      : scans.length > 1 && lead
        ? { title: t("today.working"), sub: `${productById(lead.productId)?.name} · ${CALL_LABEL[lead.call]}`, href: "/week", cta: t("today.seeWeek") }
        : { title: t("today.next", { date: SHORT.format(next) }), sub: t("n.checkin.b"), href: "/scan", cta: t("today.checkEarly") };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-plum">{DAY.format(new Date())}</p>
      <h1 className="mt-1 font-display text-3xl text-ink lg:text-4xl"><WriteOn key={t("today.title")} text={me.name ? t("today.hi", { name: me.name.split(" ")[0] }) : t("today.title")} mark={me.name ? undefined : t("today.mark")} /></h1>

      {/* 1 + 2: your skin, and the one thing to do next */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Link href="/me" data-tour="skin" className="glow-card group flex items-center gap-5 rounded-[2rem] p-5 text-white shadow-soft">
          <div className="h-32 w-28 shrink-0 rounded-2xl bg-white/90 p-1 text-ink">
            <FaceDiagram scores={latest.scores} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/80">{t("today.mySkin")}</p>
            <p className="font-display text-4xl">{latest.overall}<span className="text-lg text-white/70">/100</span></p>
            <p className="text-xs text-white/85">{skinTypeLabel(latest.scores)} · {focus.map((k) => CONCERNS[k].label.toLowerCase()).join(" & ")}</p>
            {goal ? (
              <div className="mt-3">
                <p className="text-[11px] text-white/85">{CONCERNS[goal.concern].label}: {goal.from} → {goal.target} · {goalNow}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${goalPct * 100}%` }} /></div>
              </div>
            ) : null}
            <p className="mt-3 flex items-center gap-1 text-xs">{t("today.open")} <ArrowRight className="size-3.5 transition group-hover:translate-x-1 rtl:rotate-180" /></p>
          </div>
        </Link>

        <section className={`flex flex-col justify-between rounded-[2rem] border p-5 ${st.due ? "border-rose bg-blush-100" : "border-line bg-surface"}`}>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted"><ScanFace className="size-4 text-plum" /> {t("today.checkin")} · <Flame className="size-3.5 text-rose" /> {st.n}</p>
            <p className="mt-2 font-display text-2xl text-ink">{nextStep.title}</p>
            {nextStep.sub && <p className="mt-1 text-xs text-muted">{nextStep.sub}</p>}
          </div>
          <Link href={nextStep.href} className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-plum-deep py-3 text-sm text-white hover:bg-plum">
            {nextStep.cta} <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </section>
      </div>

      {/* 3: today, routine and habits together */}
      <section id="today" className="mt-6 scroll-mt-24 rounded-[2rem] border border-line bg-surface p-5">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-medium"><CalendarHeart className="size-4 text-plum" /> {t("today.routine")}</h2>
              {steps.length > 0 && <span className="text-xs text-muted">{doneCount}/{steps.length}</span>}
            </div>
            {steps.length ? (
              <ul className="mt-3 space-y-2">
                {steps.map((r) => {
                  const p = productById(r.productId)!;
                  const on = done[key(r.slot)]?.includes(p.id) ?? false;
                  return (
                    <li key={`${r.slot}-${p.id}`}>
                      <button onClick={() => toggleDone(key(r.slot), p.id)} aria-pressed={on} className="flex w-full items-center gap-3 rounded-2xl bg-blush-50 p-2 text-start">
                        <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${on ? "border-good bg-good text-white" : "border-blush-300 text-transparent"}`}><Check className="size-3.5" /></span>
                        <ProductThumb product={p} size="sm" />
                        <span className={`min-w-0 flex-1 truncate text-sm ${on ? "text-muted line-through" : ""}`}>{p.name}</span>
                        {r.slot === "am" ? <Sun className="size-4 text-warn" /> : <Moon className="size-4 text-plum" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Link href="/routine" className="mt-3 flex items-center justify-between rounded-2xl bg-blush-50 p-4 text-sm">
                {t("plan.ready")} <ArrowRight className="size-4 text-plum rtl:rotate-180" />
              </Link>
            )}
          </div>
          <Habits dayKey={`${todayKey()}:habits`} done={done} toggle={toggleDone} bedtime={wellness.sleep.time} />
        </div>
      </section>

      {/* 4: your community, twins and circle together */}
      <section className="mt-6 rounded-[2rem] border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium"><Users className="size-4 text-plum" /> {t("today.people")}</h2>
            <p className="text-xs text-muted">{twins.length} {t("today.twinsSub")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/circles" className="inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2 text-xs text-white hover:bg-plum">
              <MessagesSquare className="size-3.5" /> {t("circ.eyebrow")} · {tr(`st.${circle}` as TKey)}
            </Link>
            <Link href="/twins" className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-xs text-plum">
              {t("today.openTwins")} <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
        {posts.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-3">
            {posts.map((p, i) => (
              <PostTile key={p.key} post={p} i={i} onOpen={() => router.push(p.personId ? `/twins/${p.personId}` : "/twins")} />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 flex items-start gap-2 text-sm text-muted">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-plum" />
        <span><b className="font-medium text-ink">{t("today.tip")}:</b> {tip}</span>
      </p>
    </div>
  );
}

// Small daily habits that show up on skin: water, sleep, a pause.
function Habits({ dayKey, done, toggle, bedtime }: { dayKey: string; done: Record<string, string[]>; toggle: (k: string, id: string) => void; bedtime: string }) {
  const { t } = useT();
  const got = done[dayKey] ?? [];
  const glasses = [1, 2, 3, 4, 5, 6].filter((n) => got.includes(`water${n}`)).length;
  return (
    <section className="lg:border-s lg:border-line lg:ps-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{t("today.habits")}</h2>
        <Link href="/settings#reminders" className="text-[11px] text-plum">Reminders</Link>
      </div>
      <p className="mt-3 text-xs text-muted">Water · {glasses}/6 glasses</p>
      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((n) => {
          const on = n <= glasses;
          return (
            <button
              key={n}
              onClick={() => {
                // Tap glass n for n glasses; tap the last full one to take it back.
                const target = n === glasses ? n - 1 : n;
                for (let k = 1; k <= 6; k++) if (k <= target !== got.includes(`water${k}`)) toggle(dayKey, `water${k}`);
              }}
              aria-label={`Glass ${n}${on ? ", drunk" : ""}`}
              aria-pressed={on}
              className={`grid size-8 place-items-center rounded-full transition ${on ? "bg-[#7fb7d8] text-white" : "bg-blush-50 text-blush-300 hover:text-[#7fb7d8]"}`}
            >
              <Droplet className={`size-4 ${on ? "fill-current" : ""}`} />
            </button>
          );
        })}
      </div>
      <ul className="mt-4 space-y-2">
        {[
          { id: "sleep", icon: Moon, label: `In bed by ${bedtime}` },
          { id: "rest", icon: Coffee, label: "A 5-minute break" },
        ].map(({ id, icon: Icon, label }) => {
          const on = got.includes(id);
          return (
            <li key={id}>
              <button onClick={() => toggle(dayKey, id)} aria-pressed={on} className="flex w-full items-center gap-3 rounded-2xl bg-blush-50 p-2.5 text-left text-sm">
                <span className={`grid size-7 place-items-center rounded-full border-2 ${on ? "border-good bg-good text-white" : "border-blush-300 text-transparent"}`}><Check className="size-3.5" /></span>
                <Icon className="size-4 text-plum" />
                <span className={on ? "text-muted line-through" : ""}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
