"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Home, Repeat, ShoppingBag, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { EASE } from "./motion";
import { ProductThumb } from "./ui";
import { personAvatar, personById } from "@/lib/people";
import { PRODUCTS, productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { planAdoption, swapScore } from "@/lib/substitute";

// Copy a twin's routine using what you already own where possible.
export function AdoptRoutine({ personId, productIds, open, onClose, onDone }: { personId: string; productIds: string[]; open: boolean; onClose: () => void; onDone?: () => void }) {
  const { latest, routine, shelf, addToShelf, addToRoutine } = useStore();
  const person = personById(personId)!;
  const owned = useMemo(() => Array.from(new Set([...shelf, ...routine.map((r) => r.productId)])), [shelf, routine]);
  const steps = useMemo(() => planAdoption(productIds, owned, latest?.scores), [productIds, owned, latest]);
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const [picking, setPicking] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSkip(new Set());
    setPicking(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const have = steps.filter((s) => s.kind !== "buy").length;
  const saved = steps.reduce((n, s) => n + (s.kind === "swap" ? productById(s.productId)!.price : 0), 0);

  function adopt() {
    for (const s of steps) {
      const id = s.kind === "swap" ? s.swap.productId : s.productId;
      if (skip.has(s.productId)) continue;
      const p = productById(id)!;
      addToRoutine(id, p.slot === "am" ? "am" : "pm");
    }
    onDone?.();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Copy ${person.name}'s routine`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-blush-50 p-5 sm:rounded-[2rem]"
          >
            <header className="flex items-center gap-3">
              <Avatar config={personAvatar(personId)} className="size-11 text-base" />
              <div className="flex-1">
                <p className="font-display text-xl">{person.name}&apos;s routine, your way</p>
                <p className="text-xs text-muted">We swapped in what you already own where it does the same job.</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-surface text-muted shadow-card"><X className="size-4" /></button>
            </header>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <p className="rounded-2xl bg-surface p-3 text-center">
                <span className="block font-display text-2xl text-plum-deep">{have}/{steps.length}</span>
                <span className="text-[11px] text-muted">already at home</span>
              </p>
              <p className="rounded-2xl bg-surface p-3 text-center">
                <span className="block font-display text-2xl text-good">${saved}</span>
                <span className="text-[11px] text-muted">saved with swaps</span>
              </p>
            </div>

            <ul className="mt-4 space-y-2">
              {steps.map((s) => {
                const theirs = productById(s.productId)!;
                const off = skip.has(s.productId);
                const alternatives = PRODUCTS.filter((p) => p.id !== theirs.id && swapScore(theirs, p) >= 55);
                return (
                  <li key={s.productId} className={`rounded-2xl border bg-surface p-3 transition ${off ? "border-line opacity-50" : "border-line"}`}>
                    <div className="flex items-center gap-2">
                      <ProductThumb product={theirs} size="sm" />
                      {s.kind === "swap" && (
                        <>
                          <ArrowRight className="size-4 shrink-0 text-muted" />
                          <ProductThumb product={productById(s.swap.productId)!} size="sm" />
                        </>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{s.kind === "swap" ? productById(s.swap.productId)!.name : theirs.name}</p>
                        {s.kind === "have" && <p className="flex items-center gap-1 text-[11px] text-good"><Home className="size-3" /> You have it</p>}
                        {s.kind === "swap" && (
                          <p className="flex items-center gap-1 text-[11px] text-plum"><Repeat className="size-3" /> Use yours instead of {theirs.name} · {s.swap.score}% similar</p>
                        )}
                        {s.kind === "buy" && <p className="flex items-center gap-1 text-[11px] text-muted"><ShoppingBag className="size-3" /> Need it · ${theirs.price}</p>}
                      </div>
                      <button
                        onClick={() => setSkip((cur) => { const n = new Set(cur); if (n.has(s.productId)) n.delete(s.productId); else n.add(s.productId); return n; })}
                        role="checkbox"
                        aria-checked={!off}
                        aria-label={`Include ${theirs.name}`}
                        className={`grid size-8 shrink-0 place-items-center rounded-full border-2 ${off ? "border-blush-300 text-transparent" : "border-plum bg-plum text-white"}`}
                      >
                        <Check className="size-4" />
                      </button>
                    </div>
                    {s.kind === "swap" && (
                      <p className="mt-2 text-[11px] text-muted">
                        {s.swap.why}.{s.swap.caution && <span className="mt-1 flex gap-1 text-warn"><AlertTriangle className="size-3.5 shrink-0" /> {s.swap.caution}</span>}
                      </p>
                    )}
                    {s.kind === "buy" && alternatives.length > 0 && (
                      <div className="mt-2">
                        {picking === s.productId ? (
                          <div className="flex flex-wrap gap-1.5">
                            {alternatives.map((p) => (
                              <button key={p.id} onClick={() => { addToShelf([p.id]); setPicking(null); }} className="flex items-center gap-1.5 rounded-full border border-line bg-blush-50 py-1 pr-3 pl-1 text-[11px] hover:border-plum">
                                <ProductThumb product={p} size="sm" /> {p.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button onClick={() => setPicking(s.productId)} className="text-[11px] text-plum underline">I have something similar</button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <button onClick={adopt} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-plum-deep py-4 text-sm font-medium text-white shadow-soft hover:bg-plum">
              <Check className="size-4" /> Adopt this routine
            </button>
            <Link href="/import" className="mt-2 block text-center text-xs text-plum underline">Add what you own from a cart or receipt</Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
