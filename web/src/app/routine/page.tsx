"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AlertTriangle, Check, CheckCircle2, FlaskConical, Leaf, Moon, Pencil, PartyPopper, Plus, ShoppingBag, Sparkles, Sun, X } from "lucide-react";
import { AdoptRoutine } from "@/components/AdoptRoutine";
import { Avatar } from "@/components/Avatar";
import { EASE } from "@/components/motion";
import { NeedScan } from "@/components/NeedScan";
import { Page, PageTitle } from "@/components/Page";
import { ProductVisual } from "@/components/ProductArt";
import { DemoNote, ProductThumb } from "@/components/ui";
import { trialVerdict } from "@/lib/cohort";
import { findConflicts } from "@/lib/conflicts";
import { personAvatar, personById } from "@/lib/people";
import { DAYS, itemsFor, planWeek, separated, weekday } from "@/lib/planner";
import { useSuggestedPlan } from "@/lib/plan";
import { productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { planAdoption } from "@/lib/substitute";
import { useTwins } from "@/lib/use-twins";

const today = () => new Date().toISOString().slice(0, 10);

export default function PlanPage() {
  const { ready, latest, routine, replaceRoutine, removeFromRoutine, done, toggleDone } = useStore();
  const { plan, improved, twins } = useSuggestedPlan();
  const [editing, setEditing] = useState(false);

  if (!ready) return null;
  if (!latest) return <NeedScan what="your plan" />;

  // No routine yet: offer the one your twins' results suggest.
  if (!routine.length) {
    return (
      <Page>
        <PageTitle
          eyebrow="Your plan"
          title="Your routine is ready"
          subtitle={`Built from what measurably worked for your ${twins} skin twins, with no ingredient clashes. One tap to start.`}
        />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[2rem] border border-line bg-surface p-6">
            {(["am", "pm"] as const).map((slot) => {
              const items = plan.filter((p) => p.slot === slot);
              if (!items.length) return null;
              return (
                <div key={slot} className="mb-6 last:mb-0">
                  <h2 className="flex items-center gap-2 text-sm font-medium">
                    {slot === "am" ? <Sun className="size-4 text-warn" /> : <Moon className="size-4 text-plum" />}
                    {slot === "am" ? "Morning" : "Evening"}
                  </h2>
                  <ol className="mt-3 space-y-2">
                    {items.map((item, i) => {
                      const p = productById(item.productId)!;
                      return (
                        <motion.li
                          key={p.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, ease: EASE }}
                          className="flex items-center gap-3 rounded-2xl bg-blush-50 p-3"
                        >
                          <span className="grid size-6 place-items-center rounded-full bg-surface text-xs text-muted">{i + 1}</span>
                          <ProductThumb product={p} size="sm" />
                          <Link href={`/product/${p.id}`} className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="text-[11px] text-muted">
                              {p.brand}
                              {improved[p.id] !== undefined ? ` · ${improved[p.id]}% of your twins improved` : " · daily protection"}
                            </p>
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </section>
          <aside className="space-y-4">
            <button
              onClick={() => replaceRoutine(plan)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-plum-deep py-4 text-sm font-medium text-white shadow-soft transition hover:bg-plum"
            >
              <Sparkles className="size-4" /> Use this routine
            </button>
            <Link href="/import" className="flex items-center justify-center gap-2 rounded-full border border-line bg-surface py-4 text-sm text-plum">
              <ShoppingBag className="size-4" /> Use what I already bought
            </Link>
            <p className="text-center text-xs text-muted">You can swap or remove any step later.</p>
          </aside>
        </div>
        <TwinRoutines />
      </Page>
    );
  }

  const key = (slot: "am" | "pm") => `${today()}:${slot}`;
  const week = planWeek(routine, latest.scores);
  const todayIdx = weekday();
  const tonight = itemsFor(routine, week, todayIdx, "pm");
  const todays = [...routine.filter((r) => r.slot === "am"), ...tonight];
  const total = todays.length;
  const doneCount = todays.filter((r) => done[key(r.slot)]?.includes(r.productId)).length;
  const all = findConflicts(routine);
  // Evening clashes the planner keeps on different nights are handled.
  const handled = all.filter((c) => c.kind === "pair" && c.slot === "pm" && separated(week, c.products[0], c.products[1]));
  const conflicts = all.filter((c) => !handled.includes(c));
  const allDone = doneCount >= total;

  return (
    <Page>
      <PageTitle
        eyebrow="Today"
        title={allDone ? "All done for today" : `${doneCount} of ${total} steps done`}
        subtitle="Tick each step as you go. Your weekly check-in shows whether it's working."
        right={
          <div className="flex gap-2">
          <Link href="/import" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-plum">
            <ShoppingBag className="size-4" /> Add what I own
          </Link>
          <button
            onClick={() => setEditing((v) => !v)}
            aria-pressed={editing}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-plum"
          >
            <Pencil className="size-4" /> {editing ? "Done editing" : "Edit routine"}
          </button>
          </div>
        }
      />

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-blush-100">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-blush-400 to-plum" animate={{ width: `${(doneCount / total) * 100}%` }} transition={{ duration: 0.5, ease: EASE }} />
      </div>

      <WeekStrip week={week} today={todayIdx} />

      {handled.map((c, i) => (
        <p key={i} className="mb-3 flex gap-2 rounded-2xl bg-good-soft p-3 text-xs text-good">
          <CheckCircle2 className="size-4 shrink-0" />
          {productById(c.products[0])?.name} and {productById(c.products[1])?.name} are on different nights in your week.
        </p>
      ))}

      {conflicts.length > 0 && (
        <section className="mb-6 space-y-2">
          {conflicts.map((c, i) => (
            <p key={i} className={`flex gap-2 rounded-2xl p-4 text-sm ${c.level === "avoid" ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"}`}>
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                <b className="font-medium">
                  {c.kind === "pair" ? `${productById(c.products[0])?.name} + ${productById(c.products[1])?.name}` : "Missing sunscreen"}.
                </b>{" "}
                {c.why} {c.fix}
              </span>
            </p>
          ))}
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {(["am", "pm"] as const).map((slot) => {
          const items = slot === "am" ? routine.filter((r) => r.slot === "am") : tonight;
          const resting = slot === "pm" ? routine.filter((r) => r.slot === "pm" && !tonight.includes(r)) : [];
          const ticked = done[key(slot)] ?? [];
          return (
            <section key={slot} className="rounded-[2rem] border border-line bg-surface p-5">
              <h2 className="flex items-center gap-2 text-base font-medium">
                {slot === "am" ? <Sun className="size-4 text-warn" /> : <Moon className="size-4 text-plum" />}
                {slot === "am" ? "Morning" : "Evening"}
                <span className="ml-auto text-xs font-normal text-muted">
                  {items.filter((r) => ticked.includes(r.productId)).length}/{items.length}
                </span>
              </h2>
              <ol className="mt-3 space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((r) => {
                    const p = productById(r.productId)!;
                    const on = ticked.includes(p.id);
                    return (
                      <motion.li key={p.id} layout exit={{ opacity: 0, x: 30 }} className="flex items-center gap-3 rounded-2xl bg-blush-50 p-2.5">
                        <button
                          onClick={() => toggleDone(key(slot), p.id)}
                          role="checkbox"
                          aria-checked={on}
                          aria-label={`Mark ${p.name} done`}
                          className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-good bg-good text-white" : "border-blush-300 text-transparent hover:border-plum"}`}
                        >
                          <motion.span key={String(on)} initial={{ scale: 0.4 }} animate={{ scale: 1 }}>
                            <Check className="size-4" />
                          </motion.span>
                        </button>
                        <ProductThumb product={p} size="sm" />
                        <Link href={`/product/${p.id}`} className={`min-w-0 flex-1 transition ${on ? "opacity-50 line-through" : ""}`}>
                          <p className="truncate text-sm">{p.name}</p>
                          <p className="text-[11px] text-muted">{p.brand}</p>
                        </Link>
                        {editing && (
                          <button onClick={() => removeFromRoutine(p.id, slot)} aria-label={`Remove ${p.name}`} className="grid size-8 place-items-center rounded-full text-muted hover:bg-bad-soft hover:text-bad">
                            <X className="size-4" />
                          </button>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
                {items.length === 0 && <li className="py-3 text-center text-xs text-muted">No steps</li>}
                {resting.map((r) => {
                  const p = productById(r.productId)!;
                  return (
                    <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-2.5 opacity-60">
                      <ProductThumb product={p} size="sm" />
                      <span className="min-w-0 flex-1 text-xs">
                        <span className="block truncate">{p.name}</span>
                        <span className="text-muted">Not tonight · {week.nights[p.id]?.map((d) => DAYS[d]).join(", ") || "paused"}</span>
                      </span>
                      {editing && (
                        <button onClick={() => removeFromRoutine(p.id, "pm")} aria-label={`Remove ${p.name}`} className="grid size-8 place-items-center rounded-full text-muted hover:bg-bad-soft hover:text-bad">
                          <X className="size-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
              {editing && (
                <Link href="/shop" className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-blush-300 py-2.5 text-xs text-plum">
                  <Plus className="size-3.5" /> Add a product
                </Link>
              )}
            </section>
          );
        })}
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-center justify-center gap-2 rounded-[2rem] bg-good-soft p-5 text-sm text-good"
          >
            <PartyPopper className="size-5" /> Routine complete. See you tomorrow.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/mix" className="flex items-center gap-3 rounded-[2rem] border border-line bg-surface p-5 text-sm transition hover:shadow-card">
          <FlaskConical className="size-6 text-plum" />
          <span>
            <span className="block font-medium">Preview my routine on my face</span>
            <span className="text-xs text-muted">Mix Lab previews what these products do together →</span>
          </span>
        </Link>
        <Link href="/journal" className="rounded-[2rem] border border-line bg-surface p-5 text-sm transition hover:shadow-card">
          <p className="font-medium">Is it working?</p>
          <p className="text-xs text-muted">Your journal tracks the measured change week by week →</p>
        </Link>
      </div>

      <TwinRoutines />

      <div className="mt-6">
        <DemoNote>Pairing alerts are general cosmetic guidance. Ask a dermatologist about prescription treatments or procedures.</DemoNote>
      </div>
    </Page>
  );
}

// The week at a glance: which strong product runs each night, and rest nights.
function WeekStrip({ week, today }: { week: ReturnType<typeof planWeek>; today: number }) {
  const strong = Object.keys(week.nights);
  if (!strong.length) return null;
  return (
    <section className="mb-6 rounded-[2rem] border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Your week</h2>
        <p className="text-[11px] text-muted">{week.gentleStart ? "Gentle start for your skin: fewer strong nights" : "Strong products never share a night"}</p>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-1.5">
        {DAYS.map((d, i) => {
          const ids = strong.filter((id) => week.nights[id].includes(i));
          return (
            <li key={d} className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 ${i === today ? "bg-plum-deep text-white" : "bg-blush-50"}`}>
              <span className="text-[10px] font-medium uppercase tracking-wider">{d}</span>
              {ids.length ? (
                ids.map((id) => (
                  <span key={id} title={productById(id)?.name} className="block">
                    <ProductThumb product={productById(id)!} size="sm" />
                  </span>
                ))
              ) : (
                <span className={`grid size-12 place-items-center rounded-xl ${i === today ? "bg-white/15" : "bg-good-soft text-good"}`} title="Recovery night">
                  <Leaf className="size-4" />
                </span>
              )}
              <span className="text-[9px] opacity-80">{ids.length ? "Active" : "Rest"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Whole routines from your closest twins, adoptable with your own products.
function TwinRoutines() {
  const { latest, routine, shelf, savedTwins, toggleSavedTwin } = useStore();
  const { featured } = useTwins();
  const [adopt, setAdopt] = useState<{ personId: string; ids: string[] } | null>(null);
  const owned = Array.from(new Set([...shelf, ...routine.map((r) => r.productId)]));
  const cards = featured
    .map((t) => ({ t, ids: t.member.trials.filter((x) => trialVerdict(x.delta) === "worked").map((x) => x.productId) }))
    .filter((c) => c.ids.length >= 2)
    .slice(0, 3);
  if (!cards.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium">Routines from people like you</h2>
      <p className="text-xs text-muted">What measurably worked for your closest twins. Adopt one and we swap in what you own.</p>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {cards.map(({ t, ids }) => {
          const person = personById(t.member.personId!)!;
          const home = planAdoption(ids, owned, latest?.scores).filter((s) => s.kind !== "buy").length;
          return (
            <li key={person.id} className="overflow-hidden rounded-[2rem] border border-line bg-surface p-2 shadow-card transition hover:-translate-y-1 hover:shadow-soft">
              {/* Cover: their top products */}
              <div className="relative h-32 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-blush-100 via-blush-200 to-[#E7DDF0]">
                <div className="absolute inset-0 flex items-end justify-center gap-1 px-4 pb-1">
                  {ids.slice(0, 3).map((id, i) => {
                    const p = productById(id)!;
                    return (
                      <span key={id} className={`relative block w-1/3 ${i === 1 ? "h-[92%]" : "h-[74%]"}`}>
                        <ProductVisual product={p} className="absolute inset-0 h-full w-full drop-shadow-md" />
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => toggleSavedTwin(person.id)}
                  aria-pressed={savedTwins.includes(person.id)}
                  className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium text-ink shadow-card backdrop-blur"
                >
                  {savedTwins.includes(person.id) ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                  {savedTwins.includes(person.id) ? "Following" : "Follow"}
                </button>
              </div>

              {/* Avatar with a match ring */}
              <div className="relative -mt-9 ml-4 flex items-end gap-2">
                <span className="relative grid size-[4.5rem] place-items-center rounded-full bg-surface">
                  <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden>
                    <circle cx="36" cy="36" r="33" fill="none" strokeWidth="3" className="stroke-blush-100" />
                    <circle cx="36" cy="36" r="33" fill="none" strokeWidth="3" strokeLinecap="round" stroke="url(#matchRing)" strokeDasharray={`${(t.similarity / 100) * 207} 207`} />
                    <defs>
                      <linearGradient id="matchRing" x1="0" x2="1">
                        <stop offset="0" stopColor="#e37ea5" />
                        <stop offset="1" stopColor="#9c5a78" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <Avatar config={personAvatar(person.id)} className="size-[3.6rem] text-xl" />
                </span>
              </div>

              <div className="px-3 pt-2">
                <Link href={`/twins/${person.id}`} className="font-display text-xl text-ink hover:text-plum">{person.name}, {person.age}</Link>
                <p className="line-clamp-1 text-xs text-muted">{person.goal}</p>
              </div>

              <div className="mx-1 mt-3 grid grid-cols-3 rounded-[1.25rem] bg-blush-50 py-3 text-center">
                <span><span className="block font-display text-lg text-ink">{t.similarity}%</span><span className="text-[10px] text-muted">Match</span></span>
                <span><span className="block font-display text-lg text-ink">{ids.length}</span><span className="text-[10px] text-muted">Steps</span></span>
                <span><span className="block font-display text-lg text-ink">{home}/{ids.length}</span><span className="text-[10px] text-muted">At home</span></span>
              </div>

              <button onClick={() => setAdopt({ personId: person.id, ids })} className="mt-2 w-full rounded-[1.25rem] bg-plum-deep py-3 text-sm font-medium text-white hover:bg-plum">
                Adopt routine
              </button>
            </li>
          );
        })}
      </ul>
      {adopt && <AdoptRoutine personId={adopt.personId} productIds={adopt.ids} open onClose={() => setAdopt(null)} />}
    </section>
  );
}
