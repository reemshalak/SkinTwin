"use client";

import { TrendMark } from "./ui";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BadgeCheck, Heart, MessageCircle, Plus, Star, UserPlus, UserCheck } from "lucide-react";
import { Avatar, avatarFromSeed } from "./Avatar";
import { ProductVisual } from "./ProductArt";
import { type ReviewPost } from "@/lib/community";
import { CONCERNS } from "@/lib/concerns";
import { personAvatar } from "@/lib/people";
import { productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { similarity } from "@/lib/twins";
import type { ConcernKey, Scores } from "@/lib/types";

const ago = (iso: string) => {
  const d = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000));
  return d < 7 ? `${d}d` : `${Math.round(d / 7)}w`;
};

// One post in the twins feed, social style: who, how alike you are, what changed, react.
export function FeedCard({ post, viewer, helpful, onHelpful, onOpen, i = 0 }: { post: ReviewPost; viewer: Scores; helpful: { count: number; mine: boolean }; onHelpful: () => void; onOpen: () => void; i?: number }) {
  const { savedTwins, toggleSavedTwin, addToRoutine, routine } = useStore();
  const [burst, setBurst] = useState(0);
  const product = productById(post.productId);
  if (!product) return null;
  const match = post.skin ? similarity(viewer, post.skin) : null;
  const top = (Object.entries(post.delta) as [ConcernKey, number][]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2);
  const following = post.personId ? savedTwins.includes(post.personId) : false;
  const inPlan = routine.some((r) => r.productId === product.id);
  const avatar = post.personId ? personAvatar(post.personId) : avatarFromSeed(post.authorSeed, post.authorName, post.authorAvatar);

  return (
    <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.05 }} className="mb-4 break-inside-avoid rounded-[1.75rem] border border-line bg-surface p-4 shadow-card">
      {/* Who */}
      <div className="flex items-center gap-3">
        <Link href={post.personId ? `/twins/${post.personId}` : "#"} className="shrink-0">
          <span className="block rounded-full bg-gradient-to-tr from-rose to-plum p-[2px]"><Avatar config={avatar} className="size-10 text-sm ring-2 ring-surface" /></span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{post.authorName}</p>
          <p className="text-[11px] text-muted">{match !== null ? `${match}% skin match · ` : ""}{ago(post.createdAt)}</p>
        </div>
        {post.personId && (
          <button onClick={() => toggleSavedTwin(post.personId!)} aria-pressed={following} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition ${following ? "bg-blush-100 text-plum" : "bg-plum-deep text-white hover:bg-plum"}`}>
            {following ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />} {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* What changed */}
      <button onClick={onOpen} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-blush-50 to-blush-100 p-3 text-start">
        <span className={`relative grid size-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${product.hue}`}>
          <ProductVisual product={product} className="h-[80%] w-[80%]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{product.name}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {top.map(([k, v]) => (
              <span key={k} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${v > 0 ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
                {CONCERNS[k].label} <TrendMark up={v > 0} tone="bare" className="-mx-0.5" /> {Math.abs(Math.round(v))} {v > 0 ? "better" : "worse"}
              </span>
            ))}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[10px] text-muted">
            {post.verified && <BadgeCheck className="size-3 text-good" />} {post.verified ? `Scan-verified · ${post.scans} scans · ${post.weeks} wk` : `${post.weeks} wk`}
          </span>
        </span>
      </button>

      {post.body && <p className="mt-3 line-clamp-3 text-sm text-ink">{post.body}</p>}
      <span className="mt-1 flex gap-0.5 text-warn" aria-label={`${post.rating} of 5`}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-3 ${n <= post.rating ? "fill-current" : "opacity-30"}`} />)}
      </span>

      {/* React */}
      <div className="mt-3 flex items-center gap-1 border-t border-line pt-2">
        <button
          onClick={() => {
            if (!helpful.mine) setBurst((b) => b + 1);
            onHelpful();
          }}
          aria-pressed={helpful.mine}
          className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${helpful.mine ? "text-rose" : "text-muted hover:text-rose"}`}
        >
          <motion.span key={burst} animate={burst ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.35 }}>
            <Heart className={`size-4 ${helpful.mine ? "fill-current" : ""}`} />
          </motion.span>
          {helpful.count || ""} Helpful
          <AnimatePresence>
            {burst > 0 && (
              <motion.span key={burst} className="pointer-events-none absolute start-3 top-0" initial={{ y: 0, opacity: 1 }} animate={{ y: -24, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
                <Heart className="size-3 fill-rose text-rose" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button onClick={onOpen} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted hover:text-plum">
          <MessageCircle className="size-4" /> Comment
        </button>
        <button
          onClick={() => !inPlan && addToRoutine(product.id, product.slot === "am" ? "am" : "pm")}
          disabled={inPlan}
          className="ms-auto inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-plum hover:border-plum disabled:border-transparent disabled:text-good"
        >
          {inPlan ? "In my plan ✓" : <><Plus className="size-3.5" /> Add to my plan</>}
        </button>
      </div>
    </motion.li>
  );
}
