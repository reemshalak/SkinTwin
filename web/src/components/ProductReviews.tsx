"use client";

import { TrendMark } from "./ui";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, PenLine, Star } from "lucide-react";
import { Avatar, avatarFromSeed } from "./Avatar";
import { PostSheet } from "./SocialFeed";
import { trialVerdict } from "@/lib/cohort";
import { CONCERNS } from "@/lib/concerns";
import { hashString } from "@/lib/random";
import type { ConcernKey } from "@/lib/types";
import { fetchReviews, SAMPLE_POSTS, type ReviewPost } from "@/lib/community";
import { useStore } from "@/lib/store";
import { similarity } from "@/lib/twins";
import type { CohortMember, ProductTrial } from "@/lib/types";
import { useEngagement } from "@/lib/use-engagement";

const ANCHOR = Date.UTC(2026, 9, 29);
const FIRST = ["Sara", "Maya", "Noor", "Lucia", "Hana", "Zoe", "Iris", "Amal", "Elena", "Kiri", "Tess", "Ruby", "Lina", "Omar", "Theo", "Sami", "Ana", "Jade", "Mira", "Leo", "Nia", "Eva", "Rami", "Ivy"];
// Community members without a public profile get a friendly first name and initial.
const nameFor = (id: string) => `${FIRST[hashString(id) % FIRST.length]} ${"ABCDEFGHJKLMNPRSTVW"[hashString(id + "x") % 19]}.`;

// Reviews for one product: real posts, community profiles, then anonymous members.
export function ProductReviews({
  productId,
  trials,
  twinsOnly,
}: {
  productId: string;
  trials: { trial: ProductTrial; member: CohortMember }[];
  twinsOnly: boolean;
}) {
  const { latest, routine } = useStore();
  const [real, setReal] = useState<ReviewPost[]>([]);
  const [limit, setLimit] = useState(6);
  const [posted, setPosted] = useState(false);
  const [open, setOpen] = useState<ReviewPost | null>(null);

  useEffect(() => {
    fetchReviews({ productId }).then(setReal);
    setPosted(new URLSearchParams(window.location.search).has("posted"));
  }, [productId]);

  const posts = useMemo(() => {
    const members = new Set(trials.map((t) => t.member.id));
    const community = SAMPLE_POSTS.filter((p) => p.productId === productId && (!twinsOnly || members.has(p.personId!)));
    const anonymous: ReviewPost[] = trials
      .filter((t) => !t.member.personId)
      .map(({ trial, member }, i) => ({
        key: `sample:${member.id}:${productId}`,
        authorName: nameFor(member.id),
        authorSeed: member.id,
        productId,
        rating: trial.rating,
        body: trial.review,
        weeks: trial.weeks,
        scans: Math.max(2, Math.round(trial.weeks / 2)),
        verified: true,
        delta: trial.delta,
        skin: member.scores,
        createdAt: new Date(ANCHOR - (i % 30) * 86_400_000).toISOString(),
      }));
    const close = (p: ReviewPost) => (latest && p.skin ? similarity(latest.scores, p.skin) : 0);
    return [...real, ...community.sort((a, b) => close(b) - close(a)), ...anonymous.sort((a, b) => close(b) - close(a))];
  }, [real, trials, productId, twinsOnly, latest]);

  const shown = posts.slice(0, limit);
  const engagement = useEngagement(shown.map((p) => p.key));
  const inRoutine = routine.some((r) => r.productId === productId);

  return (
    <section id="reviews" className="mt-5 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{twinsOnly ? "Reviews from people like you" : "All reviews"}</h2>
        {inRoutine && (
          <Link href={`/share?product=${productId}`} className="inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2 text-xs font-medium text-white">
            <PenLine className="size-3.5" /> Share how it went
          </Link>
        )}
      </div>
      {posted && (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-good-soft p-3 text-xs text-good">
          <CheckCircle2 className="size-4" /> Your review is live. Thanks for helping people with skin like yours.
        </p>
      )}
      {posts.length > 0 && <ResultBar posts={posts} />}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {shown.map((p) => (
          <li key={p.key}>
            <ReviewTile post={p} match={latest && p.skin ? similarity(latest.scores, p.skin) : null} onOpen={() => setOpen(p)} />
          </li>
        ))}
      </ul>
      <PostSheet
        post={open}
        viewer={latest?.scores}
        helpful={engagement.get}
        onHelpful={(key) => engagement.toggle(key)}
        onClose={() => setOpen(null)}
        onDeleted={(key) => setReal((r) => r.filter((x) => x.key !== key))}
      />
      {posts.length > limit && (
        <button onClick={() => setLimit((l) => l + 6)} className="mt-3 w-full rounded-full border border-line py-3 text-sm text-plum">
          Show more reviews ({posts.length - limit} more)
        </button>
      )}
    </section>
  );
}

// How everyone in this list did, as one bar.
function ResultBar({ posts }: { posts: ReviewPost[] }) {
  const counts = { worked: 0, little: 0, worse: 0 };
  for (const p of posts) if (p.verified && Object.keys(p.delta).length) counts[trialVerdict(p.delta)]++;
  const total = counts.worked + counts.little + counts.worse;
  if (!total) return null;
  const parts = [
    { k: "worked", label: "Worked", n: counts.worked, cls: "bg-good" },
    { k: "little", label: "Little change", n: counts.little, cls: "bg-blush-300" },
    { k: "worse", label: "Got worse", n: counts.worse, cls: "bg-bad" },
  ];
  return (
    <div className="mt-3">
      <div className="flex h-3 overflow-hidden rounded-full">
        {parts.map((p) => p.n > 0 && <span key={p.k} className={p.cls} style={{ width: `${(p.n / total) * 100}%` }} />)}
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-4 text-[11px] text-muted">
        {parts.map((p) => (
          <span key={p.k} className="flex items-center gap-1"><span className={`size-2 rounded-full ${p.cls}`} /> {p.label} · {p.n}</span>
        ))}
      </p>
    </div>
  );
}

// A review as a compact result card: who, their biggest measured change, stars, one line.
function ReviewTile({ post, match, onOpen }: { post: ReviewPost; match: number | null; onOpen: () => void }) {
  const [k, d] = (Object.entries(post.delta) as [ConcernKey, number][]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0] ?? [];
  return (
    <button onClick={onOpen} className="flex h-full w-full flex-col rounded-[1.5rem] border border-line bg-surface p-4 text-start transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex w-full items-center gap-2.5">
        <Avatar config={avatarFromSeed(post.authorSeed, post.authorName, post.authorAvatar)} className="size-9 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{post.authorName}</span>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            {post.verified && <BadgeCheck className="size-3.5 text-good" />}
            {match !== null ? `${match}% skin match` : `${post.weeks} weeks`}
          </span>
        </span>
        {k && (
          <span className="text-end">
            <span className={`flex items-center justify-end gap-1 font-display text-2xl leading-none ${d > 0 ? "text-good" : "text-bad"}`}>
              <TrendMark up={d > 0} />
              {Math.abs(Math.round(d))}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted">{CONCERNS[k].label}</span>
          </span>
        )}
      </div>
      <span className="mt-3 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={`size-3.5 ${n <= post.rating ? "fill-rose text-rose" : "text-blush-200"}`} />
        ))}
      </span>
      <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">&ldquo;{post.body}&rdquo;</span>
    </button>
  );
}
