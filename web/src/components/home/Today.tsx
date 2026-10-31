"use client";

import { dateFormat } from "@/lib/i18n-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowRight, CalendarHeart, CalendarPlus, Check, Flame, Moon, ScanFace, Sun, Users } from "lucide-react";
import { downloadCheckinIcs } from "@/lib/calendar";
import { type TKey } from "@/lib/i18n";
import { useMyIdentity } from "../MyAvatar";
import { WriteOn } from "../WriteOn";
import { TipBubble } from "./TipBubble";
import { DailyCare } from "./DailyCare";
import { SkinCard } from "./SkinCard";
import { useT } from "@/lib/i18n";
import { PostTile } from "../SocialFeed";
import { ProductThumb } from "../ui";
import { SAMPLE_POSTS } from "@/lib/community";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { itemsFor, planWeek, weekday } from "@/lib/planner";
import { productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { similarity, TWIN_THRESHOLD } from "@/lib/twins";
import { useTwins } from "@/lib/use-twins";
import { productCalls, streak } from "@/lib/week";
import type { ConcernKey } from "@/lib/types";

const DAY = dateFormat({ weekday: "long", day: "numeric", month: "long" });
const SHORT = dateFormat({ weekday: "short", day: "numeric", month: "short" });
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
  const { latest, scans, routine, done, toggleDone, wellness, reminderTimes } = useStore();
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

  const lead = calls.find((c) => c.call === "working") ?? calls[0];

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
        <SkinCard latest={latest} prev={scans[scans.length - 2]} />

        <section className={`flex flex-col justify-between rounded-[2rem] border p-5 ${st.due ? "border-rose bg-blush-100" : "border-line bg-surface"}`}>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted"><ScanFace className="size-4 text-plum" /> {t("today.checkin")} · <Flame className="size-3.5 text-rose" /> {st.n}</p>
            <p className="mt-2 font-display text-2xl text-ink">{nextStep.title}</p>
            {nextStep.sub && <p className="mt-1 text-xs text-muted">{nextStep.sub}</p>}
          </div>
          <Link href={nextStep.href} className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-plum-deep py-3 text-sm text-white hover:bg-plum">
            {nextStep.cta} <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
          <button
            type="button"
            onClick={() => downloadCheckinIcs(latest.capturedAt, reminderTimes.am)}
            title={t("cal.hint" as TKey)}
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface py-2.5 text-xs text-plum hover:border-plum"
          >
            <CalendarPlus className="size-3.5" /> {t("cal.add" as TKey)}
          </button>
        </section>
      </div>

      {/* 3: today, routine and habits together */}
      <section id="today" className="mt-6 scroll-mt-24 rounded-[2rem] border border-line bg-surface p-5">
        <div>
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
        </div>
      </section>

      <DailyCare dayKey={`${todayKey()}:habits`} done={done} toggle={toggleDone} bedtime={wellness.sleep.time} scores={latest.scores} />

      {/* 4: your community, twins and circle together */}
      <section className="mt-6 rounded-[2rem] border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium"><Users className="size-4 text-plum" /> {t("today.people")}</h2>
            <p className="text-xs text-muted">{twins.length} {t("today.twinsSub")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/twins" className="inline-flex items-center gap-1 rounded-full bg-plum-deep px-4 py-2 text-xs text-white hover:bg-plum">
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

      <TipBubble tips={[0, 1].flatMap((n) => focus.map((k) => ({ concern: k, label: CONCERNS[k].label, text: TIPS[k][n] })))} />
    </div>
  );
}
