"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { BadgeCheck, ShoppingBag, Star, X } from "lucide-react";
import { Avatar, avatarFromSeed } from "./Avatar";
import { EASE } from "./motion";
import { ProductVisual } from "./ProductArt";
import { ReviewCard } from "./ReviewCard";
import { SkinPatches } from "./SkinPatches";
import { trialVerdict } from "@/lib/cohort";
import { type ReviewPost } from "@/lib/community";
import { CONCERNS } from "@/lib/concerns";
import { HAS_PORTRAIT, personAvatar, personById, portraitPath } from "@/lib/people";
import { productById } from "@/lib/products";
import type { ConcernKey, Scores } from "@/lib/types";

// Instagram-style row of round avatars with a gradient ring.
export function StoryRow({ people }: { people: { id: string; match: number; seen?: boolean }[] }) {
  return (
    <ul className="-mx-5 flex snap-x scroll-px-5 lg:scroll-px-0 gap-4 overflow-x-auto px-5 pt-1 pb-3 lg:mx-0 lg:px-0">
      {people.map(({ id, match, seen }, i) => {
        const p = personById(id)!;
        return (
          <motion.li
            key={id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, ease: EASE }}
            className="shrink-0 snap-start"
          >
            <Link href={`/twins/${id}`} className="group flex w-20 flex-col items-center gap-1.5 text-center">
              <span className={`rounded-full p-[3px] ${seen ? "bg-line" : "bg-gradient-to-tr from-blush-300 via-rose to-plum"}`}>
                <span className="block rounded-full bg-blush-50 p-[3px]">
                  <Avatar config={personAvatar(id)} label={p.name} className="size-16 text-xl transition duration-300 group-hover:scale-105" />
                </span>
              </span>
              <span className="w-full truncate text-xs font-medium">{p.name}</span>
              <span className="-mt-1 text-[10px] text-plum">{match}%</span>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

function headline(post: ReviewPost) {
  const [k, v] = (Object.entries(post.delta) as [ConcernKey, number][]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0] ?? [];
  return k ? { k, v } : null;
}

const VERDICT = {
  worked: { label: "Worked", cls: "bg-good text-white" },
  worse: { label: "Didn't suit", cls: "bg-bad text-white" },
  little: { label: "Little change", cls: "bg-surface/90 text-ink" },
} as const;

// One post as a picture: the product big, the result as a number, the person small.
export function PostTile({ post, onOpen, i = 0 }: { post: ReviewPost; onOpen: () => void; i?: number }) {
  const product = productById(post.productId);
  if (!product) return null;
  const h = headline(post);
  const verdict = post.verified && h ? VERDICT[trialVerdict(post.delta)] : null;
  return (
    <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.05, ease: EASE }}>
      <button
        onClick={onOpen}
        className={`group relative block aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-br text-left ${product.hue} transition hover:-translate-y-0.5 hover:shadow-soft`}
        aria-label={`${post.authorName} on ${product.name}, ${post.rating} stars`}
      >
        <ProductVisual product={product} className="absolute inset-x-[14%] top-[12%] h-[62%] w-[72%] transition duration-500 group-hover:scale-105 group-hover:rotate-[-3deg]" />

        {verdict && <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-medium shadow-card ${verdict.cls}`}>{verdict.label}</span>}
        {h && (
          <span className="absolute top-3 right-3 rounded-2xl bg-surface/90 px-2.5 py-1.5 text-right shadow-card backdrop-blur">
            <span className={`block font-display text-xl leading-none ${h.v > 0 ? "text-good" : "text-bad"}`}>
              {h.v > 0 ? "+" : "−"}
              {Math.abs(Math.round(h.v))}
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-muted">{CONCERNS[h.k].label}</span>
          </span>
        )}

        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent p-3 pt-10 text-white">
          <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`size-3.5 ${n <= post.rating ? "fill-white text-white" : "text-white/40"}`} />
            ))}
          </span>
          <span className="mt-1.5 flex items-center gap-2">
            <Avatar config={avatarFromSeed(post.authorSeed, post.authorName, post.authorAvatar)} className="size-6 text-[10px] ring-2 ring-white/70" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium">{post.authorName}</span>
            {post.buyUrl && <ShoppingBag className="size-3.5 shrink-0 opacity-90" aria-label="Has a shop link" />}
            {post.verified && <BadgeCheck className="size-4 shrink-0" aria-label="Scan-verified" />}
          </span>
        </span>
      </button>
    </motion.li>
  );
}

// Full post in a sheet, with the same review card used elsewhere.
export function PostSheet({
  post,
  viewer,
  helpful,
  onHelpful,
  onClose,
  onDeleted,
}: {
  post: ReviewPost | null;
  viewer?: Scores;
  helpful: (key: string) => { count: number; mine: boolean };
  onHelpful: (key: string) => void;
  onClose: () => void;
  onDeleted?: (key: string) => void;
}) {
  useEffect(() => {
    if (!post) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [post, onClose]);

  const product = post ? productById(post.productId) : undefined;
  return (
    <AnimatePresence>
      {post && product && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Review of ${product.name}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-blush-50 sm:rounded-[2rem]"
          >
            <div className={`relative h-56 bg-gradient-to-br ${product.hue}`}>
              <ProductVisual product={product} className="absolute inset-x-0 top-[8%] mx-auto h-[84%] w-[60%]" />
              <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-surface/90 text-ink shadow-card">
                <X className="size-4" />
              </button>
              {post.personId && HAS_PORTRAIT.has(post.personId) && (
                <div className="absolute bottom-3 left-3 rounded-2xl bg-surface/90 p-2 shadow-card">
                  <SkinPatches photo={portraitPath(post.personId)} keys={(Object.keys(post.delta) as ConcernKey[]).slice(0, 3)} size="size-10" labels={false} />
                </div>
              )}
            </div>
            <div className="p-3">
              <ReviewCard post={post} viewer={viewer} helpful={helpful(post.key)} onHelpful={() => onHelpful(post.key)} onDeleted={() => { onDeleted?.(post.key); onClose(); }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
