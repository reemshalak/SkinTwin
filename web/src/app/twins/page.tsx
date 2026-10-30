"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, MapPin, MessagesSquare, PenLine, Search, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { NextStep } from "@/components/Journey";
import { CountUp, EASE } from "@/components/motion";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { ProductVisual } from "@/components/ProductArt";
import { PostSheet, PostTile, StoryRow } from "@/components/SocialFeed";
import { TwinMatcher } from "@/components/TwinMatcher";
import { fetchReviews, SAMPLE_POSTS, type ReviewPost } from "@/lib/community";
import { COHORT_SIZE, FEATURED } from "@/lib/cohort";
import { skinTypeLabel } from "@/lib/concerns";
import { PEOPLE, personAvatar } from "@/lib/people";
import { PRODUCTS, productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { everyone, fitScore, outcomeFor, similarity, TWIN_THRESHOLD } from "@/lib/twins";
import { useEngagement } from "@/lib/use-engagement";
import { useTwins } from "@/lib/use-twins";
import { useT } from "@/lib/i18n";

const scoresOf = (personId: string) => FEATURED.find((m) => m.personId === personId)!.scores;

export default function TwinsPage() {
  const { latest, ready, savedTwins } = useStore();
  const { twins, featured } = useTwins();
  const { t } = useT();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [real, setReal] = useState<ReviewPost[]>([]);
  const [nudge, setNudge] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<ReviewPost | null>(null);

  useEffect(() => {
    fetchReviews({ limit: 60 }).then(setReal);
  }, []);

  // Every public profile, closest skin first.
  const people = useMemo(() => {
    if (!latest) return [];
    return PEOPLE.filter((p) => p.id !== latest.sampleId)
      .map((p) => {
        const scores = scoresOf(p.id);
        return { person: p, scores, match: similarity(latest.scores, scores), type: skinTypeLabel(scores) };
      })
      .sort((a, b) => b.match - a.match);
  }, [latest]);

  const ranked = useMemo(() => {
    const all = everyone();
    const rows = PRODUCTS.filter((p) => p.category !== "makeup")
      .map((p) => ({ product: p, twin: outcomeFor(p.id, twins), all: outcomeFor(p.id, all) }))
      .filter((r) => r.twin.n >= 5);
    return {
      worked: [...rows].sort((a, b) => fitScore(b.twin) - fitScore(a.twin)).slice(0, 6),
      // Popular overall, but a poor fit for this skin: the core SkinTwin insight.
      trap: rows
        .filter((r) => r.all.avgRating >= 3.6 && r.twin.worsenedPct >= 25 && r.twin.worsenedPct > r.all.worsenedPct + 8)
        .sort((a, b) => b.twin.worsenedPct - a.twin.worsenedPct)[0],
    };
  }, [twins]);

  const query = q.trim().toLowerCase();

  // Posts from people whose skin measures close to yours, newest first.
  const feed = useMemo(() => {
    if (!latest) return [];
    const close = (p: ReviewPost) => !p.skin || similarity(latest.scores, p.skin) >= TWIN_THRESHOLD - 15;
    const notSelf = (p: ReviewPost) => !latest.sampleId || p.personId !== latest.sampleId;
    let posts = [...real, ...SAMPLE_POSTS].filter((p) => notSelf(p) && (query ? true : close(p)));
    if (query) {
      posts = posts.filter((p) => {
        const prod = productById(p.productId);
        const person = p.personId ? PEOPLE.find((x) => x.id === p.personId) : undefined;
        const about = person ? `${person.city} ${skinTypeLabel(scoresOf(person.id))} ${person.about} ${person.goal}` : "";
        return `${p.authorName} ${prod?.name} ${prod?.brand} ${about}`.toLowerCase().includes(query);
      });
    } else if (tab === "following") {
      posts = posts.filter((p) => p.personId && savedTwins.includes(p.personId));
    }
    return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 36);
  }, [latest, real, tab, savedTwins, query]);

  const foundPeople = useMemo(
    () =>
      query
        ? people.filter(({ person, type }) => `${person.name} ${person.city} ${type} ${person.about} ${person.goal}`.toLowerCase().includes(query))
        : [],
    [people, query],
  );

  const engagement = useEngagement(feed.map((p) => p.key));
  const close = useCallback(() => setOpen(null), []);

  if (!ready) return null;
  if (!latest) return <NeedScan what="your skin twins" />;

  return (
    <Page>
      <TwinMatcher scanId={latest.id} twins={twins.length} featured={featured} />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">{t("twins.eyebrow")}</p>
          <h1 className="mt-1 font-display text-3xl text-ink lg:text-4xl">
            {t("twins.title", { n: "§" }).split("§")[0]}
            <span className="text-plum">
              <CountUp value={twins.length} duration={0.8} />
            </span>
            {t("twins.title", { n: "§" }).split("§")[1]}
          </h1>
          <p className="mt-1 text-xs text-muted">{t("twins.sub", { n: COHORT_SIZE.toLocaleString() })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/circles" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-plum shadow-card hover:border-plum">
            <MessagesSquare className="size-4" /> {t("twins.circles")}
          </Link>
          <Link href="/share" className="inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-5 py-3 text-sm font-medium text-white shadow-soft hover:bg-plum">
            <PenLine className="size-4" /> {t("twins.post")}
          </Link>
        </div>
      </header>

      <label className="relative mt-6 block">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("twins.search")}
          aria-label="Search the community"
          className="w-full rounded-full border border-line bg-surface py-3.5 pr-11 pl-11 text-sm shadow-card outline-none transition focus:border-plum"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search" className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-blush-100">
            <X className="size-4" />
          </button>
        )}
      </label>

      <AnimatePresence mode="wait" initial={false}>
        {query ? (
          <motion.section key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
            <h2 className="text-sm font-medium">People · {foundPeople.length}</h2>
            {foundPeople.length ? (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {foundPeople.map(({ person, match, type }) => (
                  <li key={person.id}>
                    <Link href={`/twins/${person.id}`} className="flex items-center gap-3 rounded-[1.5rem] border border-line bg-surface p-3 transition hover:shadow-card">
                      <Avatar config={personAvatar(person.id)} className="size-12 text-lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{person.name}, {person.age}</span>
                        <span className="flex items-center gap-1 truncate text-[11px] text-muted">
                          <MapPin className="size-3 shrink-0" /> {person.city} · {type}
                        </span>
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${match >= TWIN_THRESHOLD ? "bg-plum-soft text-plum" : "bg-blush-100 text-muted"}`}>{match}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted">No one matches “{q}”.</p>
            )}
            <h2 className="mt-8 text-sm font-medium">Posts · {feed.length}</h2>
          </motion.section>
        ) : (
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <section className="mt-6">
              {/* Only real twins (80%+); if there are very few, show the closest few instead. */}
              <StoryRow
                people={(people.filter((p) => p.match >= TWIN_THRESHOLD).length >= 3 ? people.filter((p) => p.match >= TWIN_THRESHOLD) : people.slice(0, 4)).map(({ person, match }) => ({
                  id: person.id,
                  match,
                  seen: match < TWIN_THRESHOLD,
                }))}
              />
            </section>

            {ranked.worked.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-medium">{t("twins.working")}</h2>
                <ul className="-mx-5 mt-3 flex snap-x scroll-px-5 lg:scroll-px-0 gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
                  {ranked.worked.map(({ product, twin }, i) => (
                    <motion.li key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }} className="shrink-0 snap-start">
                      <Link href={`/product/${product.id}`} className="group block w-36 text-center">
                        <span className={`relative block aspect-square overflow-hidden rounded-[1.5rem] bg-gradient-to-br ${product.hue}`}>
                          <ProductVisual product={product} className="absolute inset-[14%] h-[72%] w-[72%] transition duration-500 group-hover:scale-105" />
                          <span className="absolute bottom-2 left-2 rounded-full bg-good px-2 py-0.5 text-[11px] font-medium text-white shadow-card">{twin.improvedPct}%</span>
                        </span>
                        <span className="mt-2 line-clamp-1 text-xs">{product.name}</span>
                      </Link>
                    </motion.li>
                  ))}
                  {ranked.trap && (
                    <li className="shrink-0 snap-start">
                      <Link href={`/product/${ranked.trap.product.id}`} className="group block w-36 text-center">
                        <span className={`relative block aspect-square overflow-hidden rounded-[1.5rem] bg-gradient-to-br ring-2 ring-warn ${ranked.trap.product.hue}`}>
                          <ProductVisual product={ranked.trap.product} className="absolute inset-[14%] h-[72%] w-[72%] opacity-80 grayscale-[40%]" />
                          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-warn px-2 py-0.5 text-[11px] font-medium text-white shadow-card">
                            <AlertTriangle className="size-3" /> {ranked.trap.twin.worsenedPct}% worse
                          </span>
                        </span>
                        <span className="mt-2 line-clamp-1 text-xs text-warn">{t("twins.popularRisky")}</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </section>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Feed" className="inline-flex rounded-full bg-blush-100 p-1 text-sm">
                {(
                  [
                    ["foryou", t("twins.forYou")],
                    ["following", t("twins.following", { n: savedTwins.length })],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative rounded-full px-5 py-2 transition ${tab === id ? "text-plum" : "text-muted"}`}>
                    {tab === id && <motion.span layoutId="feed-tab" className="absolute inset-0 rounded-full bg-surface shadow-card" />}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-muted">
                <BadgeCheck className="size-3.5 text-good" /> {t("twins.trust")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {nudge && (
        <p className="mt-4 rounded-2xl bg-blush-100 p-3 text-xs text-plum">
          <Link href="/login?next=/twins" className="underline">Log in</Link> to mark reviews as helpful.
        </p>
      )}

      {feed.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-blush-300 p-8 text-center text-sm text-muted">
          {query ? (
            "No posts match that search."
          ) : tab === "following" ? (
            <>
              Follow a twin and their posts show up here.{" "}
              <button onClick={() => setTab("foryou")} className="text-plum underline">See everyone</button>
            </>
          ) : (
            "No posts from people like you yet. Be the first to share."
          )}
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {feed.map((p, i) => (
            <PostTile key={p.key} post={p} i={i} onOpen={() => setOpen(p)} />
          ))}
        </ul>
      )}

      <PostSheet
        post={open}
        viewer={latest.scores}
        helpful={engagement.get}
        onHelpful={(key) => !engagement.toggle(key) && setNudge(true)}
        onClose={close}
        onDeleted={(key) => setReal((r) => r.filter((x) => x.key !== key))}
      />

      <NextStep href="/routine" label="Build my plan" hint="Turn what worked for people like you into a morning and evening routine." />
    </Page>
  );
}
