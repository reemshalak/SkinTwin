"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowRight, CalendarHeart, Check, Coffee, Droplet, Flame, Lightbulb, Moon, ScanFace, Sun, Users } from "lucide-react";
import { useMyIdentity } from "../MyAvatar";
import { WriteOn } from "../WriteOn";
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
const CALL_STYLE = { working: "bg-good-soft text-good", keep: "bg-blush-100 text-plum", early: "bg-blush-100 text-muted", pause: "bg-bad-soft text-bad", swap: "bg-warn-soft text-warn" } as const;
const CALL_LABEL = { working: "Working", keep: "Keep going", early: "Too early", pause: "Pause", swap: "Try a swap" } as const;

// Home for someone who has scanned: what to do today, at a glance.
export function Today() {
  const router = useRouter();
  const { latest, scans, routine, done, toggleDone, goal, wellness } = useStore();
  const { twins } = useTwins();
  const me = useMyIdentity();

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

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-plum">{DAY.format(new Date())}</p>
      <h1 className="mt-1 font-display text-3xl text-ink lg:text-4xl"><WriteOn text={me.name ? `Hi ${me.name.split(" ")[0]}` : "Your skin today"} mark={me.name ? undefined : "today"} /></h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* My skin */}
        <Link href="/me" data-tour="skin" className="glow-card group flex items-center gap-4 rounded-[2rem] p-5 text-white shadow-soft">
          <div className="h-28 w-24 shrink-0 rounded-2xl bg-white/90 p-1 text-ink">
            <FaceDiagram scores={latest.scores} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/80">My skin</p>
            <p className="font-display text-4xl">{latest.overall}<span className="text-lg text-white/70">/100</span></p>
            <p className="text-xs text-white/85">{skinTypeLabel(latest.scores)} · working on {focus.map((k) => CONCERNS[k].label.toLowerCase()).join(" & ")}</p>
            <p className="mt-2 flex items-center gap-1 text-xs">Open my skin <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></p>
          </div>
        </Link>

        {/* Check-in */}
        <section className={`flex flex-col justify-between rounded-[2rem] border p-5 ${st.due ? "border-rose bg-blush-100" : "border-line bg-surface"}`}>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted"><ScanFace className="size-4 text-plum" /> Weekly check-in</p>
            <p className="mt-2 font-display text-2xl text-ink">{st.due ? "Due today" : `Next: ${SHORT.format(next)}`}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Flame className="size-3.5 text-rose" /> {st.n}-week streak · {scans.length} check-in{scans.length === 1 ? "" : "s"}</p>
          </div>
          <Link href={scans.length > 1 && !st.due ? "/week" : "/scan"} className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-plum-deep py-3 text-sm text-white hover:bg-plum">
            {st.due ? "Check in now" : scans.length > 1 ? "See this week" : "Check in early"} <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* Twins */}
        <Link href="/twins" className="flex flex-col justify-between rounded-[2rem] border border-line bg-surface p-5 transition hover:shadow-card">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted"><Users className="size-4 text-plum" /> People like you</p>
            <p className="mt-2 font-display text-4xl text-ink">{twins.length}</p>
            <p className="text-xs text-muted">skin twins. See what worked for them</p>
          </div>
          <p className="mt-4 flex items-center gap-1 text-xs text-plum">Open twins <ArrowRight className="size-3.5" /></p>
        </Link>
      </div>

      {/* Today's routine */}
      <section className="mt-6 rounded-[2rem] border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-medium"><CalendarHeart className="size-4 text-plum" /> Today&apos;s routine</h2>
          {steps.length > 0 && <span className="text-xs text-muted">{doneCount}/{steps.length} done</span>}
        </div>
        {steps.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {steps.map((r) => {
              const p = productById(r.productId)!;
              const on = done[key(r.slot)]?.includes(p.id) ?? false;
              return (
                <li key={`${r.slot}-${p.id}`}>
                  <button onClick={() => toggleDone(key(r.slot), p.id)} aria-pressed={on} className="flex w-full items-center gap-3 rounded-2xl bg-blush-50 p-2 text-left">
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
            Get a routine built from what worked for your twins <ArrowRight className="size-4 text-plum" />
          </Link>
        )}
      </section>

      {/* Habits, what's working, tip */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Habits dayKey={`${todayKey()}:habits`} done={done} toggle={toggleDone} bedtime={wellness.sleep.time} />

        <section className="rounded-[2rem] border border-line bg-surface p-5">
          <h2 className="text-sm font-medium">What&apos;s working for you</h2>
          {calls.length ? (
            <ul className="mt-3 space-y-2">
              {calls.slice(0, 3).map((c) => {
                const p = productById(c.productId)!;
                return (
                  <li key={c.productId}>
                    <Link href={`/product/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-blush-50 p-2">
                      <ProductThumb product={p} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${CALL_STYLE[c.call]}`}>{CALL_LABEL[c.call]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted">Once you have a routine and a second check-in, we&apos;ll show which products are actually working.</p>
          )}
          <Link href={scans.length > 1 ? "/week" : "/routine"} className="mt-3 inline-flex items-center gap-1 text-xs text-plum">
            {scans.length > 1 ? "This week's changes" : "Build my plan"} <ArrowRight className="size-3.5" />
          </Link>
        </section>

        <section className="rounded-[2rem] bg-gradient-to-br from-blush-100 to-blush-200 p-5">
          <p className="flex items-center gap-1.5 text-xs text-plum-deep"><Lightbulb className="size-4" /> Skin tip of the day</p>
          <p className="mt-3 font-display text-xl leading-snug text-ink">{tip}</p>
          <p className="mt-3 text-[11px] text-muted">For your {CONCERNS[focus[0]].label.toLowerCase()}</p>
        </section>
      </div>

      {/* From your twins */}
      {posts.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">New from your twins</h2>
            <Link href="/twins" className="text-xs text-plum">See all</Link>
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {posts.map((p, i) => (
              <PostTile key={p.key} post={p} i={i} onOpen={() => router.push(p.personId ? `/twins/${p.personId}` : "/twins")} />
            ))}
          </ul>
        </section>
      )}

      {goal && (
        <Link href="/me" className="mt-6 flex items-center justify-between rounded-[2rem] border border-line bg-surface p-4 text-sm hover:shadow-card">
          <span>Goal: {CONCERNS[goal.concern].label} {goal.from} → {goal.target} · now {latest.scores[goal.concern]}</span>
          <ArrowRight className="size-4 text-plum" />
        </Link>
      )}
    </div>
  );
}

// Small daily habits that show up on skin: water, sleep, a pause.
function Habits({ dayKey, done, toggle, bedtime }: { dayKey: string; done: Record<string, string[]>; toggle: (k: string, id: string) => void; bedtime: string }) {
  const got = done[dayKey] ?? [];
  const glasses = [1, 2, 3, 4, 5, 6].filter((n) => got.includes(`water${n}`)).length;
  return (
    <section className="rounded-[2rem] border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Today&apos;s habits</h2>
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
