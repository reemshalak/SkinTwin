"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BadgeCheck, Clock, Loader2, MessageCircle, Send, ShoppingBag, ThumbsUp, Trash2 } from "lucide-react";
import { Avatar, avatarFromSeed } from "./Avatar";
import { EASE } from "./motion";
import { useMyIdentity } from "./MyAvatar";
import { Delta, ProductThumb, Stars } from "./ui";
import { useAuth } from "@/lib/auth";
import { deleteReview, fetchComments, postComment, sampleComments, type Comment, type ReviewPost } from "@/lib/community";
import { CONCERNS } from "@/lib/concerns";
import { productById } from "@/lib/products";
import { similarity } from "@/lib/twins";
import type { ConcernKey, Scores } from "@/lib/types";

const DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

export function VerifiedBadge({ post }: { post: ReviewPost }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${post.verified ? "bg-good-soft text-good" : "bg-blush-100 text-muted"}`}
      >
        {post.verified ? <BadgeCheck className="size-3.5" /> : <Clock className="size-3.5" />}
        {post.verified ? `Verified · ${post.scans} scans · ${post.weeks} wk` : "Early impression"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-7 left-0 z-20 w-64 rounded-2xl border border-line bg-surface p-3 text-[11px] leading-relaxed text-ink shadow-soft"
          >
            {post.verified
              ? "These numbers weren't typed. They come from two of the reviewer's own live skin scans, before starting the product and at least 3 weeks later."
              : "Posted before a second scan at least 3 weeks in. Treat it as a first impression, not a measured result."}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function ReviewCard({
  post,
  viewer,
  helpful,
  onHelpful,
  showProduct = true,
  onDeleted,
}: {
  post: ReviewPost;
  viewer?: Scores;
  helpful: { count: number; mine: boolean };
  onHelpful: () => void;
  showProduct?: boolean;
  onDeleted?: () => void;
}) {
  const auth = useAuth();
  const me = useMyIdentity();
  const product = productById(post.productId);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const match = viewer && post.skin ? similarity(viewer, post.skin) : null;
  const mine = Boolean(auth.user && post.userId === auth.user.id);
  const author = (
    <>
      <Avatar config={avatarFromSeed(post.authorSeed, post.authorName, post.authorAvatar)} className="size-9 text-sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{post.authorName}</span>
        <span className="block text-[11px] text-muted">
          {match !== null ? `${match}% skin match · ` : ""}
          {DATE.format(new Date(post.createdAt))}
        </span>
      </span>
    </>
  );

  async function toggleThread() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      const real = await fetchComments([post.key]);
      setComments([...sampleComments(post), ...real]);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    const res = await postComment(post.key, me.name || "SkinTwin member", draft.trim());
    setBusy(false);
    if (res.error) return setError(res.error);
    setComments((c) => [...(c ?? []), res.comment!]);
    setDraft("");
  }

  const replyCount = comments ? comments.length : sampleComments(post).length;

  return (
    <article className="rounded-[1.75rem] border border-line bg-surface p-5">
      <header className="flex items-start justify-between gap-3">
        {post.personId ? (
          <Link href={`/twins/${post.personId}`} className="flex min-w-0 items-center gap-3">
            {author}
          </Link>
        ) : (
          <span className="flex min-w-0 items-center gap-3">{author}</span>
        )}
        <VerifiedBadge post={post} />
      </header>

      {showProduct && product && (
        <Link href={`/product/${product.id}`} className="mt-4 flex items-center gap-3 rounded-2xl bg-blush-50 p-2.5 transition hover:bg-blush-100">
          <ProductThumb product={product} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{product.name}</span>
            <span className="block text-[11px] text-muted">{product.brand}</span>
          </span>
          <Stars value={post.rating} />
        </Link>
      )}
      {!showProduct && (
        <p className="mt-3">
          <Stars value={post.rating} />
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed">{post.body}</p>

      {Object.keys(post.delta).length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5">
          {(Object.entries(post.delta) as [ConcernKey, number][])
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 4)
            .map(([k, v]) => (
              <span key={k} className="rounded-full bg-blush-50 px-2.5 py-1 text-[11px]">
                {CONCERNS[k].label} <Delta value={v} />
              </span>
            ))}
        </p>
      )}

      {post.buyUrl && post.verified && (
        <a
          href={post.buyUrl}
          {...(post.buyUrl.startsWith("/") ? {} : { target: "_blank", rel: "sponsored noopener noreferrer nofollow" })}
          className="mt-3 flex items-center gap-2 rounded-2xl border border-blush-200 bg-blush-50 px-3 py-2.5 text-xs transition hover:border-plum"
        >
          <ShoppingBag className="size-4 text-plum" />
          <span className="flex-1">
            Shop where {post.authorName} bought it
            {!post.buyUrl.startsWith("/") && <span className="block text-[10px] text-muted">{new URL(post.buyUrl).hostname.replace(/^www\./, "")}</span>}
          </span>
          {post.buyAffiliate && <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">Affiliate link</span>}
        </a>
      )}

      <footer className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs">
        <button
          onClick={onHelpful}
          aria-pressed={helpful.mine}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${helpful.mine ? "bg-plum-soft text-plum" : "text-muted hover:bg-blush-100 hover:text-plum"}`}
        >
          <ThumbsUp className={`size-3.5 ${helpful.mine ? "fill-current" : ""}`} /> Helpful · {helpful.count}
        </button>
        <button onClick={toggleThread} aria-expanded={open} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted transition hover:bg-blush-100 hover:text-plum">
          <MessageCircle className="size-3.5" /> {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </button>
        {mine && (
          <button
            onClick={async () => {
              await deleteReview(post.key);
              onDeleted?.();
            }}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-muted hover:text-bad"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        )}
      </footer>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
            <ul className="mt-3 space-y-3">
              {comments === null && (
                <li className="flex justify-center py-2 text-muted">
                  <Loader2 className="size-4 animate-spin" />
                </li>
              )}
              {comments?.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <Avatar config={avatarFromSeed(c.user_id, c.author_name)} className="size-7 text-xs" />
                  <p className="rounded-2xl bg-blush-50 px-3 py-2 text-xs leading-relaxed">
                    <b className="font-medium">{c.author_name}</b> {c.body}
                  </p>
                </li>
              ))}
            </ul>
            {auth.user ? (
              <form onSubmit={send} className="mt-3 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={300}
                  placeholder="Ask or add something…"
                  aria-label="Write a reply"
                  className="flex-1 rounded-full border border-line bg-blush-50 px-4 py-2 text-xs outline-none focus:border-plum"
                />
                <button disabled={busy || !draft.trim()} aria-label="Send reply" className="grid size-8 place-items-center rounded-full bg-plum-deep text-white disabled:opacity-50">
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-xs text-muted">
                <Link href="/login" className="text-plum underline">Log in</Link> to reply.
              </p>
            )}
            {error && <p className="mt-2 text-xs text-bad">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
