"use client";

import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, Copy, MapPin, Moon, Plus, Sun, Target, UserCheck, UserPlus } from "lucide-react";
import { AdoptRoutine } from "@/components/AdoptRoutine";
import { Avatar } from "@/components/Avatar";
import { ProfileCover } from "@/components/ProfileCover";
import { SkinPatches } from "@/components/SkinPatches";
import { CountUp, EASE, GrowBar, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Page, PageTitle } from "@/components/Page";
import { Delta, ProductThumb, Stars } from "@/components/ui";
import { CONCERN_KEYS, CONCERNS, skinTypeLabel } from "@/lib/concerns";
import { FEATURED, trialVerdict } from "@/lib/cohort";
import { HAS_AFTER, HAS_PORTRAIT, afterPath, personAvatar, personById, portraitPath } from "@/lib/people";
import { BeforeAfter } from "@/components/BeforeAfter";
import { productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { similarity, storyOf } from "@/lib/twins";
import type { ConcernKey, ProductTrial } from "@/lib/types";

const TABS = ["Journey", "Routine", "Compare"] as const;
type Tab = (typeof TABS)[number];

const net = (t: ProductTrial) => Object.values(t.delta).reduce((s, v) => s + v, 0);

export default function TwinProfilePage() {
  const { id } = useParams<{ id: string }>();
  const person = personById(id);
  const member = FEATURED.find((m) => m.personId === id);
  const { latest, routine, addToRoutine, savedTwins, toggleSavedTwin } = useStore();
  const [tab, setTab] = useState<Tab>("Journey");
  const [adopting, setAdopting] = useState(false);

  if (!person || !member) {
    return (
      <Page>
        <PageTitle title="Profile not found" back={{ href: "/twins", label: "Your twins" }} />
      </Page>
    );
  }

  const photo = HAS_PORTRAIT.has(person.id) ? portraitPath(person.id) : null;
  const match = latest ? similarity(latest.scores, member.scores) : null;
  const saved = savedTwins.includes(person.id);
  const { best, bestNet } = storyOf(member);
  const bestProduct = productById(best.productId)!;
  const trials = [...member.trials].sort((a, b) => net(b) - net(a));
  const worked = trials.filter((t) => trialVerdict(t.delta) === "worked");
  const weeks = member.trials.reduce((s, t) => s + t.weeks, 0);
  const biggest = member.trials
    .flatMap((t) => (Object.entries(t.delta) as [ConcernKey, number][]).map(([k, v]) => ({ k, v })))
    .reduce((a, b) => (b.v > a.v ? b : a), { k: "moisture" as ConcernKey, v: 0 });
  const inRoutine = (pid: string) => routine.some((r) => r.productId === pid);
  const copied = worked.length > 0 && worked.every((t) => inRoutine(t.productId));
  return (
    <Page className="!pt-0 lg:!pt-0">
      <AdoptRoutine personId={person.id} productIds={worked.map((t) => t.productId)} open={adopting} onClose={() => setAdopting(false)} />
      {/* Cover */}
      <section className="relative -mx-5 lg:-mx-8">
        <div className="relative h-48 overflow-hidden lg:h-64 lg:rounded-b-[2.5rem]">
          <ProfileCover className="h-full" />
          <BackLink href="/twins" className="absolute top-5 start-5 inline-flex items-center gap-1 rounded-full bg-surface/85 px-3 py-1.5 text-sm text-plum backdrop-blur lg:start-8">Back</BackLink>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 lg:px-8">
          <div className="relative z-10 -mt-20 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-5">
            <Avatar config={personAvatar(person.id)} label={`${person.name}'s avatar`} className="size-32 border-[6px] border-blush-50 shadow-soft lg:size-40" />
            <div className="pb-2">
              <h1 className="font-display text-3xl lg:text-4xl">
                {person.name}, {person.age}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {person.city}
                </span>
                <span className="rounded-full bg-blush-100 px-2.5 py-0.5 text-xs text-plum">{skinTypeLabel(member.scores)} skin</span>
                {match !== null && <span className="rounded-full bg-plum px-2.5 py-0.5 text-xs font-medium text-white">{match}% match</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => toggleSavedTwin(person.id)}
              aria-pressed={saved}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                saved ? "bg-blush-100 text-plum" : "bg-plum-deep text-white hover:bg-plum"
              }`}
            >
              {saved ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
              {saved ? "Following" : "Follow"}
            </button>
            {worked.length > 0 && (
              <button
                onClick={() => setAdopting(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-5 py-2.5 text-sm text-plum hover:shadow-card"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Added to my plan" : "Copy their routine"}
              </button>
            )}
            {latest && (
              <button onClick={() => setTab("Compare")} className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm text-plum hover:shadow-card">
                Compare with me
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[20rem_1fr]">
        {/* About */}
        <aside className="space-y-5">
          <Reveal className="rounded-[2rem] border border-line bg-surface p-5">
            <p className="font-display text-lg leading-snug">&ldquo;{person.about}&rdquo;</p>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted">
              <Target className="mt-0.5 size-4 shrink-0 text-plum" /> Goal: {person.goal}
            </p>
            {photo && (
              <div className="mt-5 border-t border-line pt-4">
                {HAS_AFTER.has(person.id) && (
                  <>
                    <p className="mb-2 text-xs text-muted">{person.name}&apos;s first scan and week 8</p>
                    <BeforeAfter before={photo} after={afterPath(person.id)} labels={["Week 1", "Week 8"]} className="mb-4 aspect-[3/4] rounded-[1.5rem]" />
                  </>
                )}
                <p className="mb-2 text-xs text-muted">Skin close-ups shared by {person.name}</p>
                <SkinPatches photo={photo} keys={[...CONCERN_KEYS].sort((a, b) => member.scores[a] - member.scores[b]).slice(0, 3)} />
              </div>
            )}
          </Reveal>
          <Stagger as="div" className="grid grid-cols-2 gap-3">
            {[
              { label: "Products tried", value: member.trials.length },
              { label: "Weeks tracked", value: weeks },
              { label: "Worked", value: worked.length },
              { label: `Biggest gain · ${CONCERNS[biggest.k].label.toLowerCase()}`, value: Math.round(biggest.v), prefix: "+" },
            ].map((s) => (
              <StaggerItem as="div" key={s.label} className="rounded-3xl border border-line bg-surface p-4">
                <p className="text-[11px] text-muted">{s.label}</p>
                <p className="font-display text-2xl text-plum-deep">
                  {s.prefix}
                  <CountUp value={s.value} />
                </p>
              </StaggerItem>
            ))}
          </Stagger>
          {bestNet > 2 && (
            <Reveal className="glow-card rounded-[2rem] p-5 text-white shadow-soft">
              <p className="text-xs opacity-90">What finally worked for {person.name}</p>
              <div className="mt-3 flex items-center gap-3">
                <ProductThumb product={bestProduct} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{bestProduct.name}</p>
                  <p className="text-xs opacity-90">{best.weeks} weeks · ${bestProduct.price}</p>
                </div>
              </div>
              <button
                onClick={() => addToRoutine(bestProduct.id, bestProduct.slot === "am" ? "am" : "pm")}
                disabled={inRoutine(bestProduct.id)}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-surface py-2.5 text-sm font-medium text-plum disabled:opacity-80"
              >
                {inRoutine(bestProduct.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
                {inRoutine(bestProduct.id) ? "In my plan" : "Add to my plan"}
              </button>
            </Reveal>
          )}
        </aside>

        {/* Tabs */}
        <section>
          <div role="tablist" aria-label={`${person.name}'s profile`} className="inline-flex rounded-full bg-blush-100 p-1">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                disabled={t === "Compare" && !latest}
                className={`relative rounded-full px-5 py-2 text-sm transition disabled:opacity-40 ${tab === t ? "text-plum-deep" : "text-muted hover:text-plum"}`}
              >
                {tab === t && <motion.span layoutId="twin-tab" className="absolute inset-0 rounded-full bg-surface shadow-card" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                <span className="relative">{t}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }} className="mt-5">
              {tab === "Journey" && (
                <ol className="space-y-3">
                  <p className="text-xs text-muted">Every product was measured with a skin scan before and after.</p>
                  {trials.map((t) => {
                    const p = productById(t.productId)!;
                    const v = trialVerdict(t.delta);
                    return (
                      <li key={t.productId} className="relative rounded-3xl border border-line bg-surface p-5 transition hover:border-plum hover:shadow-card">
                        <div className="flex flex-wrap items-center gap-4">
                          <ProductThumb product={p} size="sm" />
                          <Link href={`/product/${p.id}`} className="min-w-0 flex-1 after:absolute after:inset-0 after:rounded-3xl after:content-['']">
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-[11px] text-muted">
                              {t.weeks} weeks · <Stars value={t.rating} />
                            </p>
                          </Link>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              v === "worked" ? "bg-good-soft text-good" : v === "worse" ? "bg-bad-soft text-bad" : "bg-blush-100 text-muted"
                            }`}
                          >
                            {v === "worked" ? "Worked" : v === "worse" ? "Made it worse" : "Little change"}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed">&ldquo;{t.review}&rdquo;</p>
                        <p className="mt-2 flex flex-wrap gap-x-4 text-[11px] text-muted">
                          {(Object.entries(t.delta) as [ConcernKey, number][]).map(([k, v]) => (
                            <span key={k}>
                              {CONCERNS[k].label} <Delta value={v} />
                            </span>
                          ))}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}

              {tab === "Routine" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {(["am", "pm"] as const).map((slot) => {
                    const items = worked.filter((t) => {
                      const s = productById(t.productId)!.slot;
                      return s === slot || s === "both";
                    });
                    return (
                      <div key={slot} className="rounded-[2rem] border border-line bg-surface p-5">
                        <h3 className="flex items-center gap-2 text-sm font-medium">
                          {slot === "am" ? <Sun className="size-4 text-warn" /> : <Moon className="size-4 text-plum" />}
                          {person.name}&apos;s {slot === "am" ? "morning" : "evening"}
                        </h3>
                        <ul className="mt-3 space-y-2">
                          {items.map((t) => {
                            const p = productById(t.productId)!;
                            return (
                              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-blush-50 p-2.5">
                                <ProductThumb product={p} size="sm" />
                                <Link href={`/product/${p.id}`} className="min-w-0 flex-1 truncate text-sm">
                                  {p.name}
                                </Link>
                                <button
                                  onClick={() => addToRoutine(p.id, slot)}
                                  disabled={inRoutine(p.id)}
                                  aria-label={`Add ${p.name} to my plan`}
                                  className="grid size-8 place-items-center rounded-full bg-surface text-plum shadow-card disabled:opacity-60"
                                >
                                  {inRoutine(p.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
                                </button>
                              </li>
                            );
                          })}
                          {items.length === 0 && <li className="py-3 text-center text-xs text-muted">Nothing that worked yet</li>}
                        </ul>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted md:col-span-2">Only products that measurably worked for {person.name} are shown.</p>
                </div>
              )}

              {tab === "Compare" && latest && (
                <div className="rounded-[2rem] border border-line bg-surface p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">You vs {person.name}</h3>
                    <span className="font-display text-3xl text-plum-deep">{match}%</span>
                  </div>
                  <ul className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
                    {CONCERN_KEYS.map((k, i) => (
                      <li key={k}>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{CONCERNS[k].label}</span>
                          <span className="tabular-nums text-muted">
                            you {latest.scores[k]} · {person.name} {member.scores[k]}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 rounded-full bg-blush-100">
                            <GrowBar value={latest.scores[k]} delay={i * 0.04} className="h-full rounded-full bg-plum" />
                          </div>
                          <div className="h-1.5 rounded-full bg-blush-100">
                            <GrowBar value={member.scores[k]} delay={i * 0.04 + 0.1} className="h-full rounded-full bg-blush-400" />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 flex items-center gap-4 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-plum" /> You</span>
                    <span className="inline-flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-blush-400" /> {person.name}</span>
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </section>
      </div>
    </Page>
  );
}
