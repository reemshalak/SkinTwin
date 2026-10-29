"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PenLine } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { fetchReviews, SAMPLE_POSTS, type ReviewPost } from "@/lib/community";
import { useStore } from "@/lib/store";
import { similarity } from "@/lib/twins";
import type { CohortMember, ProductTrial } from "@/lib/types";
import { useEngagement } from "@/lib/use-engagement";

const ANCHOR = Date.UTC(2026, 9, 29);

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
  const [limit, setLimit] = useState(5);
  const [posted, setPosted] = useState(false);

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
        authorName: `Member ${member.id.toUpperCase()}`,
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
      <ul className="mt-3 space-y-3">
        {shown.map((p) => (
          <li key={p.key}>
            <ReviewCard
              post={p}
              viewer={latest?.scores}
              showProduct={false}
              helpful={engagement.get(p.key)}
              onHelpful={() => engagement.toggle(p.key)}
              onDeleted={() => setReal((r) => r.filter((x) => x.key !== p.key))}
            />
          </li>
        ))}
      </ul>
      {posts.length > limit && (
        <button onClick={() => setLimit((l) => l + 5)} className="mt-3 w-full rounded-full border border-line py-3 text-sm text-plum">
          Show more reviews ({posts.length - limit} more)
        </button>
      )}
    </section>
  );
}
