"use client";

import { dateFormat } from "@/lib/i18n-core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, Heart, Lock, MessageSquare, Package, Pencil, ScanFace, Settings, Sparkles, Users } from "lucide-react";
import { GoalCard } from "@/components/GoalCard";
import { Extras } from "@/components/Extras";
import { FaceDiagram, Ring } from "@/components/report/Visuals";
import { Reveal } from "@/components/motion";
import { AvatarEditor } from "@/components/AvatarEditor";
import { useMyIdentity } from "@/components/MyAvatar";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { PersonCard } from "@/components/PersonCard";
import { ReviewCard } from "@/components/ReviewCard";
import { fetchReviews, type ReviewPost } from "@/lib/community";
import { useEngagement } from "@/lib/use-engagement";
import { ProfileCover } from "@/components/ProfileCover";
import { SaveHeart } from "@/components/SaveHeart";
import { SaveProfile } from "@/components/SaveProfile";
import { ProductThumb, TrendMark } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { CONCERN_KEYS, CONCERNS, skinTypeLabel } from "@/lib/concerns";
import { FEATURED } from "@/lib/cohort";
import { PRODUCTS } from "@/lib/products";
import { sampleById } from "@/lib/samples";
import { useStore } from "@/lib/store";
import { similarity } from "@/lib/twins";
import { useTwins } from "@/lib/use-twins";
import { useT } from "@/lib/i18n";

const DATE = dateFormat({ month: "short", year: "numeric" });

export default function MePage() {
  const { ready, latest, scans, savedTwins, savedProducts, shelf, setIdentity } = useStore();
  const auth = useAuth();
  const me = useMyIdentity();
  const { t } = useT();
  const { twins } = useTwins();
  const [tab, setTab] = useState<"following" | "wishlist" | "shelf" | "reviews">("following");
  const [myReviews, setMyReviews] = useState<ReviewPost[]>([]);
  useEffect(() => {
    if (auth.user) fetchReviews({ userId: auth.user.id }).then(setMyReviews);
  }, [auth.user]);
  const engagement = useEngagement(myReviews.map((p) => p.key));
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState("");

  if (!ready) return null;
  if (!latest) return <NeedScan what="your profile" />;

  const type = skinTypeLabel(latest.scores);
  const first = scans[0];
  const change = latest.overall - first.overall;
  const focus = [...CONCERN_KEYS].sort((a, b) => latest.scores[a] - latest.scores[b]).slice(0, 2);
  const following = FEATURED.filter((m) => savedTwins.includes(m.personId!)).map((member) => ({ member, similarity: similarity(latest.scores, member.scores) }));
  const wishlist = PRODUCTS.filter((p) => savedProducts.includes(p.id));
  const shelfItems = PRODUCTS.filter((p) => shelf.includes(p.id));

  async function share() {
    const strongest = [...CONCERN_KEYS].sort((a, b) => latest!.scores[b] - latest!.scores[a])[0];
    const text = `I'm on SkinTwin: ${type} skin, ${latest!.overall}/100, and ${twins.length} people share my skin. Strongest: ${CONCERNS[strongest].label}.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }


  return (
    <Page className="!pt-0 lg:!pt-0">
      {/* Identity over a soft pink cover */}
      <ProfileCover className="-mx-5 h-40 lg:-mx-8 lg:h-52 lg:rounded-b-[2.5rem]" />
      <section className="relative z-10 -mt-12 flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-5">
          <AvatarEditor className="size-28 text-5xl" />
          <div className="pb-1">
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = draft.trim();
                  setIdentity({ displayName: n });
                  if (auth.user && n) auth.updateName(n);
                  setEditingName(false);
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Your name"
                  aria-label="Display name"
                  className="w-48 rounded-2xl border border-line bg-surface px-3 py-1.5 font-display text-2xl outline-none focus:border-plum"
                />
                <button className="rounded-full bg-plum-deep px-4 py-2 text-sm text-white">Save</button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setDraft(me.name);
                  setEditingName(true);
                }}
                className="group flex items-center gap-2 text-start"
              >
                <h1 className="font-display text-3xl">{me.name || "Add your name"}</h1>
                <Pencil className="size-4 text-muted opacity-60 transition group-hover:opacity-100" />
              </button>
            )}
            <p className="text-sm text-muted">
              {type} skin · since {DATE.format(new Date(first.capturedAt))}
              {auth.user && <span> · {auth.user.email}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pb-1">
          <Link href="/settings" aria-label="Settings" className="grid size-11 place-items-center rounded-full border border-line bg-surface text-plum hover:shadow-card">
            <Settings className="size-4" />
          </Link>
          <button onClick={share} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-plum hover:shadow-card">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Share"}
          </button>
          <Link href="/scan" className="inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2.5 text-sm font-medium text-white">
            <ScanFace className="size-4" /> {t("me.checkin")}
          </Link>
        </div>
      </section>

      <SaveProfile className="mt-6" />

      {/* My skin: the map, the scores, progress and the journal, always here */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[19rem_1fr]">
        <Link href="/analysis" className="group relative block rounded-[2rem] border border-line bg-surface p-5 transition hover:shadow-soft">
          <p className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1.5"><ScanFace className="size-4 text-plum" /> {t("me.map")}</span>
            <span className="font-display text-2xl text-plum-deep">{latest.overall}<span className="text-sm text-muted">/100</span></span>
          </p>
          <div className="mx-auto mt-2 aspect-[5/6] w-full max-w-[15rem]">
            <FaceDiagram scores={latest.scores} />
          </div>
          <p className="text-center text-xs text-muted">
            {t("me.working", { a: focus.map((k) => CONCERNS[k].label.toLowerCase()).join(" & ") })}
          </p>
          <span className="mt-3 flex items-center justify-center gap-1 text-xs text-plum">
            {t("me.photo")} <ArrowRight className="rtl:-scale-x-100 size-3.5 transition group-hover:translate-x-1" />
          </span>
        </Link>

        <div className="space-y-6">
          <ul className="grid grid-cols-4 gap-3 rounded-[2rem] border border-line bg-surface p-4 sm:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8">
            {CONCERN_KEYS.map((k, i) => (
              <li key={k}>
                <Link href={`/report/${k}`} className="block transition hover:scale-105">
                  <Ring value={latest.scores[k]} label={CONCERNS[k].label} i={i} size={64} />
                </Link>
              </li>
            ))}
          </ul>

          {scans.length > 1 && (
            <Link href="/week" className="glow-card flex items-center justify-between gap-4 rounded-[2rem] p-5 text-white shadow-soft">
              <span>
                <span className="block text-xs text-white/80">Since your first check-in</span>
                <span className="font-display text-3xl"><TrendMark up={change >= 0} tone="onDark" /> {Math.abs(change)} points {change >= 0 ? "better" : "worse"}</span>
              </span>
              <span className="flex items-center gap-1 text-xs">This week <ArrowRight className="rtl:-scale-x-100 size-4" /></span>
            </Link>
          )}

          <GoalCard />

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/journal" className="flex items-center gap-2 rounded-[1.5rem] border border-line bg-surface p-2 pe-4 text-sm hover:shadow-card">
              <span className="flex -space-x-3">
                {scans.slice(-3).map((s) => {
                  const photo = s.photo ?? (s.sampleId ? sampleById(s.sampleId)?.image : undefined);
                  return (
                    <span key={s.id} className="size-10 overflow-hidden rounded-xl border-2 border-surface bg-blush-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {photo && <img src={photo} alt="" className="h-full w-full scale-110 object-cover blur-[3px]" />}
                    </span>
                  );
                })}
              </span>
              {scans.length === 1 ? t("me.journal1") : t("me.journal", { n: scans.length })}
            </Link>
            <Link href="/report" className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-3 text-sm text-plum hover:shadow-card">
              <Sparkles className="size-4" /> {t("me.report")}
            </Link>
          </div>
        </div>
      </section>

      {/* Following / Wishlist */}
      <Reveal className="mt-12">
        <div id="saved" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Saved" className="inline-flex max-w-full overflow-x-auto whitespace-nowrap rounded-full bg-blush-100 p-1 text-sm [scrollbar-width:none]">
            {(
              [
                ["following", t("me.following", { n: following.length }), Users],
                ["wishlist", t("me.wishlist", { n: wishlist.length }), Heart],
                ["shelf", t("me.shelf", { n: shelfItems.length }), Package],
                ["reviews", t("me.reviews", { n: myReviews.length }), MessageSquare],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 transition ${tab === id ? "bg-surface text-plum shadow-card" : "text-muted"}`}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "following" &&
          (following.length === 0 ? (
            <p className="mt-4 rounded-3xl border border-dashed border-blush-300 p-8 text-center text-sm text-muted">
              Follow people like you to see what&apos;s working for them.{" "}
              <Link href="/twins" className="text-plum underline">
                Find your twins
              </Link>
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {following.map((t) => (
                <li key={t.member.id}>
                  <PersonCard twin={t} />
                </li>
              ))}
            </ul>
          ))}

        {tab === "wishlist" &&
          (wishlist.length === 0 ? (
            <p className="mt-4 rounded-3xl border border-dashed border-blush-300 p-8 text-center text-sm text-muted">
              Tap the heart on any product to keep it here.{" "}
              <Link href="/shop" className="text-plum underline">
                Discover products
              </Link>
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((p) => (
                <li key={p.id} className="relative">
                  <Link href={`/product/${p.id}`} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 pe-14 transition hover:shadow-card">
                    <ProductThumb product={p} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block text-[11px] text-muted">
                        {p.brand} · ${p.price.toFixed(2)}
                      </span>
                    </span>
                  </Link>
                  <SaveHeart productId={p.id} className="absolute top-1/2 end-3 -translate-y-1/2" />
                </li>
              ))}
            </ul>
          ))}
        {tab === "shelf" &&
          (shelfItems.length === 0 ? (
            <p className="mt-4 rounded-3xl border border-dashed border-blush-300 p-8 text-center text-sm text-muted">
              Products you already own, so we can swap them into routines.{" "}
              <Link href="/import" className="text-plum underline">Add what I own</Link>
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shelfItems.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.id}`} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 transition hover:shadow-card">
                    <ProductThumb product={p} />
                    <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        {tab === "reviews" &&
          (myReviews.length === 0 ? (
            <p className="mt-4 rounded-3xl border border-dashed border-blush-300 p-8 text-center text-sm text-muted">
              {auth.user ? "Tried a product for a few weeks? Your measured result helps people with skin like yours." : "Log in to share reviews."}{" "}
              <Link href={auth.user ? "/share" : "/login?next=/me"} className="text-plum underline">
                {auth.user ? "Share how it went" : "Log in"}
              </Link>
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {myReviews.map((p) => (
                <li key={p.key}>
                  <ReviewCard
                    post={p}
                    helpful={engagement.get(p.key)}
                    onHelpful={() => engagement.toggle(p.key)}
                    onDeleted={() => setMyReviews((r) => r.filter((x) => x.key !== p.key))}
                  />
                </li>
              ))}
            </ul>
          ))}
      </Reveal>

      <Extras />
      <p className="mt-12 flex items-center justify-center gap-2 text-center text-xs text-muted">
        <Lock className="size-3.5" /> Others see your name and the profile photo you chose. Scan photos and this skin page stay private to you.
      </p>
    </Page>
  );
}
