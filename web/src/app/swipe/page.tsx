"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, FlaskConical, Heart, RotateCcw, Undo2, Users, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { ProductVisual } from "@/components/ProductArt";
import { conflictsIfAdded } from "@/lib/conflicts";
import { ACTIVE_LABELS, PRODUCTS, productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { fitScore, outcomeFor } from "@/lib/twins";
import type { Product } from "@/lib/types";
import { useTwins } from "@/lib/use-twins";

const THRESHOLD = 110;

export default function SwipePage() {
  const { ready, latest, routine, savedProducts, toggleSavedProduct } = useStore();
  const { twins } = useTwins();
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<{ id: string; yes: boolean }[]>([]);
  const [exitX, setExitX] = useState(0);

  // Best fit for your twins first; makeup last.
  const deck = useMemo(
    () =>
      PRODUCTS.map((p) => ({ p, o: outcomeFor(p.id, twins) })).sort(
        (a, b) => Number(a.p.category === "makeup") - Number(b.p.category === "makeup") || fitScore(b.o) - fitScore(a.o),
      ),
    [twins],
  );

  const decide = useCallback(
    (yes: boolean) => {
      const card = deck[index];
      if (!card) return;
      setExitX(yes ? 600 : -600);
      if (yes && !savedProducts.includes(card.p.id)) toggleSavedProduct(card.p.id);
      setHistory((h) => [...h, { id: card.p.id, yes }]);
      setIndex((i) => i + 1);
    },
    [deck, index, savedProducts, toggleSavedProduct],
  );

  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    if (last.yes && savedProducts.includes(last.id)) toggleSavedProduct(last.id);
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => i - 1);
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") decide(true);
      if (e.key === "ArrowLeft") decide(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [decide]);

  if (!ready) return null;
  if (!latest) return <NeedScan what="your product matches" />;

  const liked = history.filter((h) => h.yes).map((h) => h.id);
  const done = index >= deck.length;

  return (
    <Page className="!max-w-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">Quick pick</p>
          <h1 className="font-display text-2xl text-ink">Yes or no?</h1>
        </div>
        <p className="text-xs text-muted tabular-nums">{Math.min(index + 1, deck.length)} / {deck.length}</p>
      </div>

      <div className="relative mt-5 aspect-[3/4] w-full">
        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-line bg-surface p-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-blush-100 text-plum"><Heart className="size-7 fill-current" /></span>
            <p className="font-display text-2xl">You liked {liked.length}</p>
            <div className="flex -space-x-3">
              {liked.slice(0, 5).map((id) => {
                const p = productById(id)!;
                return (
                  <span key={id} className={`relative size-14 overflow-hidden rounded-full border-2 border-surface bg-gradient-to-br ${p.hue}`}>
                    <ProductVisual product={p} className="absolute inset-[10%] h-[80%] w-[80%]" />
                  </span>
                );
              })}
            </div>
            <div className="flex w-full flex-col gap-2">
              {liked.length > 0 && (
                <Link href={`/mix?ids=${liked.slice(0, 3).join(",")}`} className="flex items-center justify-center gap-2 rounded-full bg-plum-deep py-3.5 text-sm font-medium text-white">
                  <FlaskConical className="size-4" /> Mix them in the Lab
                </Link>
              )}
              <Link href="/me" className="rounded-full border border-line py-3.5 text-sm text-plum">See my wishlist</Link>
              <button onClick={() => { setIndex(0); setHistory([]); }} className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted">
                <RotateCcw className="size-3.5" /> Start over
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {deck[index + 1] && <Card key={deck[index + 1].p.id + "-next"} product={deck[index + 1].p} improved={deck[index + 1].o.improvedPct} n={deck[index + 1].o.n} clash={undefined} behind />}
            <AnimatePresence custom={exitX}>
              <Card
                key={deck[index].p.id}
                product={deck[index].p}
                improved={deck[index].o.improvedPct}
                n={deck[index].o.n}
                worse={deck[index].o.worsenedPct}
                clash={conflictsIfAdded(routine, deck[index].p.id, deck[index].p.slot === "am" ? "am" : "pm")[0]?.products.find((x) => x !== deck[index].p.id)}
                exitX={exitX}
                onSwipe={decide}
              />
            </AnimatePresence>
          </>
        )}
      </div>

      {!done && (
        <div className="mt-6 flex items-center justify-center gap-5">
          <button onClick={() => decide(false)} aria-label="No" className="grid size-16 place-items-center rounded-full border border-line bg-surface text-bad shadow-card transition hover:scale-105">
            <X className="size-7" />
          </button>
          <button onClick={undo} disabled={!history.length} aria-label="Undo" className="grid size-11 place-items-center rounded-full border border-line bg-surface text-muted shadow-card disabled:opacity-40">
            <Undo2 className="size-4" />
          </button>
          <button onClick={() => decide(true)} aria-label="Yes, save it" className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-rose to-plum text-white shadow-soft transition hover:scale-105">
            <Heart className="size-7 fill-current" />
          </button>
        </div>
      )}
      <p className="mt-4 text-center text-[11px] text-muted">Swipe right to save, left to skip. Arrow keys work too.</p>
    </Page>
  );
}

function Card({
  product,
  improved,
  n,
  worse = 0,
  clash,
  behind,
  exitX = 0,
  onSwipe,
}: {
  product: Product;
  improved: number;
  n: number;
  worse?: number;
  clash?: string;
  behind?: boolean;
  exitX?: number;
  onSwipe?: (yes: boolean) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const yesOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const noOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);
  const enough = n >= 5;

  return (
    <motion.div
      className={`absolute inset-0 touch-none select-none ${behind ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"}`}
      style={behind ? undefined : { x, rotate }}
      initial={behind ? { scale: 0.94, y: 14, opacity: 0.7 } : { scale: 0.94, y: 14 }}
      animate={behind ? { scale: 0.94, y: 14, opacity: 0.7 } : { scale: 1, y: 0, opacity: 1 }}
      exit={{ x: exitX, opacity: 0, rotate: exitX > 0 ? 18 : -18, transition: { duration: 0.35, ease: EASE } }}
      drag={behind ? false : "x"}
      dragSnapToOrigin
      onDragEnd={(_: unknown, info: PanInfo) => {
        if (info.offset.x > THRESHOLD || info.velocity.x > 600) onSwipe?.(true);
        else if (info.offset.x < -THRESHOLD || info.velocity.x < -600) onSwipe?.(false);
      }}
    >
      <div className={`relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br shadow-soft ${product.hue}`}>
        <ProductVisual product={product} className="pointer-events-none absolute inset-x-[18%] top-[8%] h-[52%] w-[64%]" />

        {!behind && (
          <>
            <motion.span style={{ opacity: yesOpacity }} className="absolute top-6 start-6 -rotate-12 rounded-xl border-4 border-good px-3 py-1 font-display text-2xl text-good">SAVE</motion.span>
            <motion.span style={{ opacity: noOpacity }} className="absolute top-6 end-6 rotate-12 rounded-xl border-4 border-bad px-3 py-1 font-display text-2xl text-bad">SKIP</motion.span>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-5 pt-16 text-white">
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{product.brand}</p>
          <p className="font-display text-2xl leading-tight">{product.name}</p>
          <p className="mt-1 text-xs opacity-80">
            {product.actives.filter((a) => a !== "fragrance").slice(0, 2).map((a) => ACTIVE_LABELS[a]).join(" · ") || product.category} · ${product.price}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {enough ? (
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${improved >= 50 ? "bg-good" : "bg-white/20 backdrop-blur"}`}>
                <Users className="size-4" /> {improved}% of your twins improved
              </span>
            ) : (
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs backdrop-blur">Few twins have tried this yet</span>
            )}
            {enough && worse >= 25 && <span className="rounded-full bg-bad px-3 py-1.5 text-xs font-medium">{worse}% got worse</span>}
            {clash && (
              <span className="flex items-center gap-1 rounded-full bg-warn px-3 py-1.5 text-xs font-medium">
                <AlertTriangle className="size-3.5" /> Clashes with {productById(clash)?.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
