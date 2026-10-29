"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookHeart, CalendarHeart, Check, Copy, Heart, Lock, MessageSquare, Pencil, ScanFace, Settings, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { MyAvatar, useMyIdentity } from "@/components/MyAvatar";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { PersonCard } from "@/components/PersonCard";
import { ReviewCard } from "@/components/ReviewCard";
import { fetchReviews, type ReviewPost } from "@/lib/community";
import { useEngagement } from "@/lib/use-engagement";
import { ProfileCover } from "@/components/ProfileCover";
import { SaveHeart } from "@/components/SaveHeart";
import { SaveProfile } from "@/components/SaveProfile";
import { ProductThumb } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { CONCERN_KEYS, CONCERNS, skinTypeLabel } from "@/lib/concerns";
import { FEATURED } from "@/lib/cohort";
import { personAvatar } from "@/lib/people";
import { PRODUCTS } from "@/lib/products";
import { useStore } from "@/lib/store";
import { similarity } from "@/lib/twins";
import { useTwins } from "@/lib/use-twins";

const DATE = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });
const today = () => new Date().toISOString().slice(0, 10);

export default function MePage() {
  const { ready, latest, scans, routine, savedTwins, savedProducts, done, setIdentity } = useStore();
  const auth = useAuth();
  const me = useMyIdentity();
  const { twins, featured } = useTwins();
  const [tab, setTab] = useState<"following" | "wishlist" | "reviews">("following");
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
  const doneToday = [...(done[`${today()}:am`] ?? []), ...(done[`${today()}:pm`] ?? [])].length;
  const following = FEATURED.filter((m) => savedTwins.includes(m.personId!)).map((member) => ({ member, similarity: similarity(latest.scores, member.scores) }));
  const wishlist = PRODUCTS.filter((p) => savedProducts.includes(p.id));

  async function share() {
    const strongest = [...CONCERN_KEYS].sort((a, b) => latest!.scores[b] - latest!.scores[a])[0];
    const text = `I'm on SkinTwin: ${type} skin, ${latest!.overall}/100, and ${twins.length} people share my skin. Strongest: ${CONCERNS[strongest].label}.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const cards = [
    {
      href: "/analysis",
      icon: ScanFace,
      label: "My skin map",
      big: `${latest.overall}/100`,
      sub: `${type} skin · working on ${focus.map((k) => CONCERNS[k].label.toLowerCase()).join(" & ")}`,
    },
    {
      href: "/twins",
      icon: Users,
      label: "People like me",
      big: `${twins.length}`,
      sub: "share your skin. See what worked for them",
      avatars: featured.slice(0, 4).map((t) => t.member.personId!),
    },
    {
      href: "/journal",
      icon: BookHeart,
      label: "Journal",
      big: `${scans.length} check-in${scans.length === 1 ? "" : "s"}`,
      sub: scans.length > 1 ? `${change >= 0 ? "+" : ""}${change} points since your first scan` : "Check in weekly to see progress",
    },
    {
      href: "/routine",
      icon: CalendarHeart,
      label: "Today's plan",
      big: routine.length ? `${doneToday}/${routine.length}` : "Not set",
      sub: routine.length ? "steps done today" : "Get a routine built from your twins",
    },
  ];

  return (
    <Page className="!pt-0 lg:!pt-0">
      {/* Identity over a soft pink cover */}
      <ProfileCover className="-mx-5 h-40 lg:-mx-8 lg:h-52 lg:rounded-b-[2.5rem]" />
      <section className="relative z-10 -mt-12 flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-5">
          <MyAvatar className="size-28 text-5xl ring-[6px] ring-blush-50" />
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
                className="group flex items-center gap-2 text-left"
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
            <ScanFace className="size-4" /> Weekly check-in
          </Link>
        </div>
      </section>

      <SaveProfile className="mt-6" />

      {/* Four things that matter, each one tappable */}
      <Stagger as="div" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ href, icon: Icon, label, big, sub, avatars }, i) => (
          <StaggerItem as="div" key={label}>
            <Link
              href={href}
              className={`group flex h-full flex-col rounded-[1.75rem] p-5 transition hover:-translate-y-1 hover:shadow-soft ${
                i === 0 ? "glow-card text-white" : "border border-line bg-surface"
              }`}
            >
              <span className={`flex items-center gap-2 text-xs ${i === 0 ? "text-white/85" : "text-muted"}`}>
                <Icon className="size-4" /> {label}
              </span>
              <span className="mt-3 font-display text-4xl">{big}</span>
              <span className={`mt-1 text-xs leading-relaxed ${i === 0 ? "text-white/85" : "text-muted"}`}>{sub}</span>
              {avatars && (
                <span className="mt-3 flex -space-x-2">
                  {avatars.map((id) => (
                    <Avatar key={id} config={personAvatar(id)} className="size-8 border-2 border-surface text-sm" />
                  ))}
                </span>
              )}
              <ArrowRight className={`mt-auto size-4 self-end pt-1 transition group-hover:translate-x-1 ${i === 0 ? "text-white" : "text-plum"}`} />
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Following / Wishlist */}
      <Reveal className="mt-12">
        <div id="saved" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Saved" className="inline-flex rounded-full bg-blush-100 p-1 text-sm">
            {(
              [
                ["following", `Following · ${following.length}`, Users],
                ["wishlist", `Wishlist · ${wishlist.length}`, Heart],
                ["reviews", `My reviews · ${myReviews.length}`, MessageSquare],
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
                  <Link href={`/product/${p.id}`} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 pr-14 transition hover:shadow-card">
                    <ProductThumb product={p} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block text-[11px] text-muted">
                        {p.brand} · ${p.price.toFixed(2)}
                      </span>
                    </span>
                  </Link>
                  <SaveHeart productId={p.id} className="absolute top-1/2 right-3 -translate-y-1/2" />
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

      <p className="mt-12 flex items-center justify-center gap-2 text-center text-xs text-muted">
        <Lock className="size-3.5" /> Others see only your name and initial. Your scan photos stay private on this device.
      </p>
    </Page>
  );
}
