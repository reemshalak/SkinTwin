"use client";

import { motion } from "motion/react";
import { BadgeCheck, MessageCircle, ThumbsUp } from "lucide-react";
import { Avatar, avatarFromSeed } from "../Avatar";
import { EASE } from "../motion";
import { Delta, ProductThumb, Stars } from "../ui";
import { sampleHelpful, SAMPLE_POSTS } from "@/lib/community";
import { CONCERNS } from "@/lib/concerns";
import { productById } from "@/lib/products";
import type { ConcernKey } from "@/lib/types";

const POST = SAMPLE_POSTS.find((p) => p.rating >= 4 && Object.values(p.delta).some((v) => v >= 6)) ?? SAMPLE_POSTS[0];
const REPLIES = [
  { name: "Noor", text: "Same skin type here. Any purging in week 2?", seed: "noor" },
  { name: POST.authorName, text: "A little around my chin, gone by week 3. Worth pushing through.", seed: POST.authorSeed },
  { name: "Sam", text: "Adding it to my plan, thanks for the numbers.", seed: "sam" },
];

// A review with its conversation: SkinTwin is people with your skin talking.
export function CommunityPeek() {
  const product = productById(POST.productId)!;
  const top = (Object.entries(POST.delta) as [ConcernKey, number][]).sort((a, b) => b[1] - a[1])[0];
  return (
    <div className="mx-auto max-w-xl">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="rounded-[2rem] border border-line bg-surface p-5 shadow-soft"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <Avatar config={avatarFromSeed(POST.authorSeed, POST.authorName)} className="size-10 text-base" />
            <span>
              <span className="block text-sm font-medium">{POST.authorName}</span>
              <Stars value={POST.rating} />
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-good-soft px-2.5 py-1 text-[11px] font-medium text-good">
            <BadgeCheck className="size-3.5" /> Verified
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-blush-50 p-2.5">
          <ProductThumb product={product} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm">{product.name}</span>
          {top && (
            <span className="text-xs">
              {CONCERNS[top[0]].label} <Delta value={top[1]} />
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed">{POST.body}</p>
        <p className="mt-3 flex gap-4 border-t border-line pt-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5 text-plum">
            <ThumbsUp className="size-3.5 fill-current" /> Helpful · {sampleHelpful(POST.key)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-3.5" /> {REPLIES.length} replies
          </span>
        </p>
        <ul className="mt-3 space-y-2.5">
          {REPLIES.map((r, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.25, ease: EASE }}
              className={`flex gap-2.5 ${r.name === POST.authorName ? "pl-8" : ""}`}
            >
              <Avatar config={avatarFromSeed(r.seed, r.name)} className="size-7 text-xs" />
              <p className="rounded-2xl bg-blush-50 px-3 py-2 text-xs leading-relaxed">
                <b className="font-medium">{r.name}</b> {r.text}
              </p>
            </motion.li>
          ))}
        </ul>
      </motion.article>
    </div>
  );
}
