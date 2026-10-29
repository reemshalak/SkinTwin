"use client";

import { motion } from "motion/react";
import { BadgeCheck, HelpCircle } from "lucide-react";
import { Avatar, avatarFromSeed } from "../Avatar";
import { EASE } from "../motion";
import { Delta, Stars } from "../ui";
import { SAMPLE_POSTS } from "@/lib/community";
import { CONCERNS } from "@/lib/concerns";
import { productById } from "@/lib/products";
import type { ConcernKey } from "@/lib/types";

// A strong verified post with clear numbers, for the side-by-side.
const VERIFIED = SAMPLE_POSTS.filter((p) => Object.values(p.delta).some((v) => v >= 8) && p.rating >= 4)[0] ?? SAMPLE_POSTS[0];

export function TrustCompare() {
  const product = productById(VERIFIED.productId)!;
  const deltas = (Object.entries(VERIFIED.delta) as [ConcernKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-2">
      <motion.article
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative rounded-[2rem] border border-dashed border-blush-300 bg-surface/60 p-6"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">A typical review</p>
        <div className="mt-4 flex items-center gap-3 opacity-70">
          <span className="grid size-10 place-items-center rounded-full bg-blush-200 text-muted">?</span>
          <div>
            <p className="text-sm font-medium">glowgirl_92</p>
            <Stars value={5} />
          </div>
        </div>
        <p className="mt-4 font-display text-2xl leading-snug text-muted">&ldquo;OMG holy grail!!! Best product ever 😍😍&rdquo;</p>
        <ul className="mt-6 space-y-2 text-xs text-muted">
          {["Skin type unknown", "No before or after", "Could be sponsored"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <HelpCircle className="size-4 text-blush-400" /> {t}
            </li>
          ))}
        </ul>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, x: 16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        className="relative rounded-[2rem] border border-line bg-surface p-6 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.18em] text-plum">A SkinTwin review</p>
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0.55, delay: 0.6 }}
            className="inline-flex items-center gap-1 rounded-full bg-good-soft px-3 py-1 text-xs font-medium text-good"
          >
            <BadgeCheck className="size-4" /> Verified by {VERIFIED.scans} scans
          </motion.span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Avatar config={avatarFromSeed(VERIFIED.authorSeed, VERIFIED.authorName)} className="size-10 text-base" />
          <div>
            <p className="text-sm font-medium">{VERIFIED.authorName}</p>
            <p className="text-[11px] text-muted">{VERIFIED.weeks} weeks on {product.name}</p>
          </div>
        </div>
        <p className="mt-4 font-display text-2xl leading-snug">&ldquo;{VERIFIED.body}&rdquo;</p>
        <ul className="mt-5 grid grid-cols-3 gap-2">
          {deltas.map(([k, v], i) => (
            <motion.li
              key={k}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.12 }}
              className="rounded-2xl bg-blush-50 p-3 text-center"
            >
              <p className="text-[10px] text-muted">{CONCERNS[k].label}</p>
              <p className="font-display text-2xl">
                <Delta value={v} />
              </p>
            </motion.li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-muted">Numbers come from two live skin scans, before and after. Nobody can type them.</p>
      </motion.article>
    </div>
  );
}
