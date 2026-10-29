"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Suspense, useEffect, useState } from "react";
import { BadgeCheck, Clock, Loader2, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { EASE } from "@/components/motion";
import { useMyIdentity } from "@/components/MyAvatar";
import { NeedScan } from "@/components/NeedScan";
import { Page, PageTitle } from "@/components/Page";
import { Delta, ProductThumb } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { postReview } from "@/lib/community";
import { CONCERNS } from "@/lib/concerns";
import { PRODUCTS, productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { ConcernKey } from "@/lib/types";
import { measureProduct, MIN_WEEKS } from "@/lib/verify";

const DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

function ShareForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, latest, scans, routine } = useStore();
  const auth = useAuth();
  const me = useMyIdentity();
  const mineFirst = [...routine.map((r) => r.productId), ...PRODUCTS.map((p) => p.id)].filter((id, i, a) => a.indexOf(id) === i);
  const [productId, setProductId] = useState<string>(params.get("product") ?? mineFirst[0] ?? PRODUCTS[0].id);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = params.get("product");
    if (p) setProductId(p);
  }, [params]);

  if (!ready) return null;
  if (!latest) return <NeedScan what="the share flow" />;

  const product = productById(productId)!;
  const m = measureProduct(productId, routine, scans)!;
  const weeksLeft = Math.max(0, MIN_WEEKS - m.weeks);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Tap the stars to rate it.");
    if (!body.trim()) return setError("Add one line about how it went.");
    setBusy(true);
    setError(null);
    const res = await postReview({
      authorName: me.name || "SkinTwin member",
      productId,
      rating,
      body: body.trim(),
      weeks: m.weeks,
      scans: m.scans,
      verified: m.verified,
      delta: m.verified ? m.delta : {},
      skin: latest!.scores,
    });
    setBusy(false);
    if (res.error) return setError(res.error);
    router.push(`/product/${productId}?posted=1#reviews`);
  }

  if (!auth.user) {
    return (
      <Page className="!max-w-xl">
        <PageTitle eyebrow="Share" title="Share how it went" subtitle="Reviews are tied to an account so people know they're from someone real." />
        <div className="flex gap-2">
          <Link href="/login?next=/share" className="rounded-full border border-line bg-surface px-5 py-3 text-sm text-plum">Log in</Link>
          <Link href="/signup?next=/share" className="rounded-full bg-plum-deep px-5 py-3 text-sm text-white">Create free account</Link>
        </div>
      </Page>
    );
  }

  return (
    <Page className="!max-w-3xl">
      <PageTitle eyebrow="Share" title="How did it go?" subtitle="Your measured change comes from your own check-ins. You only add stars and a line." />

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-[2rem] border border-line bg-surface p-5">
          <p className="flex items-center justify-between text-xs font-medium">
            Product
            <Link href="/import" className="font-normal text-plum underline">Not here? Add from cart</Link>
          </p>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {mineFirst.slice(0, 14).map((id) => {
              const p = productById(id)!;
              const on = id === productId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setProductId(id)}
                  aria-pressed={on}
                  className={`flex w-28 shrink-0 flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${on ? "border-plum bg-blush-100" : "border-line hover:border-blush-300"}`}
                >
                  <ProductThumb product={p} />
                  <span className="line-clamp-2 text-[11px] leading-snug">{p.name}</span>
                  {routine.some((r) => r.productId === id) && <span className="text-[10px] text-plum">In your plan</span>}
                </button>
              );
            })}
          </div>
        </section>

        <motion.section
          key={productId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className={`rounded-[2rem] p-5 ${m.verified ? "bg-good-soft" : "bg-blush-100"}`}
        >
          <p className={`flex items-center gap-2 text-sm font-medium ${m.verified ? "text-good" : "text-plum"}`}>
            {m.verified ? <BadgeCheck className="size-4" /> : <Clock className="size-4" />}
            {m.verified ? "Verified by your scans" : "Early impression"}
          </p>
          {m.verified ? (
            <>
              <p className="mt-1 text-xs text-muted">
                {DATE.format(new Date(m.before.capturedAt))} → {DATE.format(new Date(m.after.capturedAt))} · {m.weeks} weeks · {m.scans} check-ins
              </p>
              <p className="mt-3 flex flex-wrap gap-1.5">
                {(Object.entries(m.delta) as [ConcernKey, number][]).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-surface px-2.5 py-1 text-[11px]">
                    {CONCERNS[k].label} <Delta value={v} />
                  </span>
                ))}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">
              {m.weeks === 0 ? "You have one check-in since starting this product." : `${m.weeks} week${m.weeks === 1 ? "" : "s"} of check-ins so far.`} Check in again
              {weeksLeft ? ` in ${weeksLeft} week${weeksLeft === 1 ? "" : "s"}` : ""} to turn this into a verified review with measured numbers.{" "}
              <Link href="/journal" className="text-plum underline">Open journal</Link>
            </p>
          )}
        </motion.section>

        <section className="rounded-[2rem] border border-line bg-surface p-5">
          <p className="text-xs font-medium">Your rating for {product.name}</p>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? "" : "s"}`} onClick={() => setRating(n)} className="p-1">
                <motion.span animate={{ scale: rating >= n ? 1.1 : 1 }} className="block">
                  <Star className={`size-8 transition ${rating >= n ? "fill-rose text-rose" : "text-blush-300"}`} />
                </motion.span>
              </button>
            ))}
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-medium">In one line</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. Cleared my forehead in 4 weeks, a little dry at first."
              className="mt-1 w-full resize-none rounded-2xl border border-line bg-blush-50 px-4 py-3 text-sm outline-none focus:border-plum focus:bg-surface"
            />
          </label>
          <p className="mt-2 text-[11px] text-muted">Posting as {me.name || "SkinTwin member"} with your initial. Your photos are never shared.</p>
        </section>

        {error && <p className="rounded-2xl bg-bad-soft p-3 text-sm text-bad">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-plum-deep py-4 text-sm font-medium text-white shadow-soft transition hover:bg-plum disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" />} Post review
        </button>
      </form>
    </Page>
  );
}

export default function SharePage() {
  return (
    <Suspense>
      <ShareForm />
    </Suspense>
  );
}
