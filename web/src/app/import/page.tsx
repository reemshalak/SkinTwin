"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { Check, ImageUp, Link2, Loader2, PenLine, ScanText, ShoppingBag, Sparkles, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Page, PageTitle } from "@/components/Page";
import { ProductThumb } from "@/components/ui";
import { matchProducts, type ImportMatch } from "@/lib/import";
import { productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { outcomeFor } from "@/lib/twins";
import { useTwins } from "@/lib/use-twins";

type Stage = { kind: "pick" } | { kind: "reading"; label: string; progress: number; preview?: string } | { kind: "done"; matches: ImportMatch[]; from: string; preview?: string; note?: string };

const SAMPLE = "/sample-cart.png";

// Reads the screenshot in this browser; the image is never uploaded.
async function readImage(src: File | string, onProgress: (p: number) => void) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => m.status === "recognizing text" && onProgress(m.progress),
  });
  try {
    const { data } = await worker.recognize(src);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

export default function ImportPage() {
  const router = useRouter();
  const { latest, routine, addToRoutine, addToShelf, savedProducts, toggleSavedProduct } = useStore();
  const { twins } = useTwins();
  const [stage, setStage] = useState<Stage>({ kind: "pick" });
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [off, setOff] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  async function fromImage(src: File | string) {
    setError(null);
    const preview = typeof src === "string" ? src : URL.createObjectURL(src);
    setStage({ kind: "reading", label: "Reading your screenshot", progress: 0, preview });
    try {
      const text = await readImage(src, (progress) => setStage((s) => (s.kind === "reading" ? { ...s, progress } : s)));
      finish(matchProducts(text), "screenshot", preview);
    } catch {
      setStage({ kind: "pick" });
      setError("Couldn't read that image. Try a sharper screenshot of the cart or order page.");
    }
  }

  async function fromLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStage({ kind: "reading", label: "Opening the link", progress: 0.3 });
    const res = await fetch("/api/import-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const data = (await res.json().catch(() => ({}))) as { names?: string[]; host?: string; partial?: boolean; error?: string };
    if (!res.ok || !data.names) {
      setStage({ kind: "pick" });
      return setError(data.error ?? "Couldn't open that link.");
    }
    const note = data.partial ? `${data.host} keeps carts private, so we matched from the link itself. A screenshot finds more.` : undefined;
    finish(matchProducts(data.names.join("\n")), data.host ?? "link", undefined, note);
  }

  function finish(matches: ImportMatch[], from: string, preview?: string, note?: string) {
    setOff(new Set());
    setStage({ kind: "done", matches, from, preview, note });
  }

  const chosen = stage.kind === "done" ? stage.matches.filter((m) => !off.has(m.productId)) : [];

  function addAll() {
    addToShelf(chosen.map((m) => m.productId));
    for (const m of chosen) {
      const p = productById(m.productId)!;
      addToRoutine(p.id, p.slot === "am" ? "am" : "pm");
    }
    router.push("/routine");
  }

  return (
    <Page className="!max-w-4xl">
      <PageTitle
        back={{ href: "/routine", label: "My plan" }}
        eyebrow="Add from cart"
        title="Already bought it? Skip the typing."
        subtitle="Drop a cart or order screenshot, or paste a cart link. We find the products and fill in your plan."
      />

      <AnimatePresence mode="wait">
        {stage.kind === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ease: EASE }} className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f?.type.startsWith("image/")) fromImage(f);
              }}
              className="group flex min-h-64 flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-blush-300 bg-gradient-to-br from-blush-50 to-surface p-8 text-center transition hover:border-plum hover:shadow-card"
            >
              <span className="grid size-16 place-items-center rounded-3xl bg-surface text-plum shadow-card transition group-hover:scale-105">
                <ImageUp className="size-7" />
              </span>
              <span>
                <span className="block font-display text-xl text-ink">Screenshot</span>
                <span className="mt-1 block text-xs text-muted">Cart, order email or receipt · read on your device</span>
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) fromImage(f);
                e.target.value = "";
              }}
            />

            <form onSubmit={fromLink} className="flex min-h-64 flex-col justify-center gap-4 rounded-[2rem] border border-line bg-surface p-8">
              <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-blush-100 text-plum">
                <Link2 className="size-7" />
              </span>
              <p className="text-center font-display text-xl text-ink">Cart link</p>
              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  type="url"
                  required
                  placeholder="https://shop.example/cart/…"
                  className="min-w-0 flex-1 rounded-full border border-line bg-blush-50 px-4 py-3 text-sm outline-none focus:border-plum focus:bg-surface"
                />
                <button className="rounded-full bg-plum-deep px-5 text-sm font-medium text-white hover:bg-plum">Find</button>
              </div>
              <p className="text-center text-[11px] text-muted">Shared carts, wishlists or product pages</p>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-3 md:col-span-2">
              <button onClick={() => fromImage(SAMPLE)} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-sm text-plum hover:shadow-card">
                <ShoppingBag className="size-4" /> Try a sample cart
              </button>
              {error && <p className="w-full rounded-2xl bg-bad-soft p-3 text-center text-sm text-bad">{error}</p>}
            </div>
          </motion.div>
        )}

        {stage.kind === "reading" && (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto flex max-w-md flex-col items-center gap-6 py-6 text-center">
            {stage.preview ? (
              <div className="relative w-full overflow-hidden rounded-[2rem] border border-line bg-surface shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stage.preview} alt="" className="max-h-80 w-full object-contain opacity-80" />
                <div className="animate-scanline pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-rose/30 to-transparent" />
              </div>
            ) : (
              <Loader2 className="size-10 animate-spin text-plum" />
            )}
            <div className="w-full">
              <p className="flex items-center justify-center gap-2 text-sm font-medium">
                <ScanText className="size-4 text-plum" /> {stage.label}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blush-100">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-blush-400 to-plum" animate={{ width: `${Math.max(8, stage.progress * 100)}%` }} />
              </div>
            </div>
          </motion.div>
        )}

        {stage.kind === "done" && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASE }}>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-good-soft text-good">
                {stage.matches.length ? <Sparkles className="size-5" /> : <X className="size-5" />}
              </span>
              <p className="font-display text-2xl text-ink">
                {stage.matches.length ? `Found ${stage.matches.length} product${stage.matches.length === 1 ? "" : "s"}` : "No skincare found"}
              </p>
              <button onClick={() => setStage({ kind: "pick" })} className="ml-auto text-sm text-plum underline">Try another</button>
            </div>
            {stage.note && <p className="mb-4 rounded-2xl bg-blush-100 p-3 text-xs text-ink">{stage.note}</p>}

            <ul className="grid gap-3 sm:grid-cols-2">
              {stage.matches.map((m, i) => (
                <MatchCard
                  key={m.productId}
                  m={m}
                  i={i}
                  on={!off.has(m.productId)}
                  toggle={() => setOff((s) => { const n = new Set(s); if (n.has(m.productId)) n.delete(m.productId); else n.add(m.productId); return n; })}
                  inPlan={routine.some((r) => r.productId === m.productId)}
                  improved={latest && twins.length ? outcomeFor(m.productId, twins).improvedPct : undefined}
                  saved={savedProducts.includes(m.productId)}
                  save={() => toggleSavedProduct(m.productId)}
                />
              ))}
            </ul>

            {stage.matches.length > 0 && (
              <div className="sticky bottom-24 mt-6 flex flex-wrap gap-3 lg:bottom-6">
                <button
                  onClick={addAll}
                  disabled={!chosen.length}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-plum-deep py-4 text-sm font-medium text-white shadow-soft transition hover:bg-plum disabled:opacity-50"
                >
                  <Check className="size-4" /> Add {chosen.length} to my plan
                </button>
                <button
                  onClick={() => {
                    addToShelf(chosen.map((m) => m.productId));
                    router.push("/routine");
                  }}
                  disabled={!chosen.length}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-4 text-sm text-plum disabled:opacity-50"
                >
                  Just add to my shelf
                </button>
                {chosen[0] && (
                  <Link href={`/share?product=${chosen[0].productId}`} className="flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-4 text-sm text-plum">
                    <PenLine className="size-4" /> Review one
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}

function MatchCard({ m, i, on, toggle, inPlan, improved, saved, save }: { m: ImportMatch; i: number; on: boolean; toggle: () => void; inPlan: boolean; improved?: number; saved: boolean; save: () => void }) {
  const p = useMemo(() => productById(m.productId)!, [m.productId]);
  return (
    <motion.li
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: i * 0.09, ease: EASE }}
      className={`relative flex gap-3 rounded-[1.75rem] border bg-surface p-3 transition ${on ? "border-plum shadow-card" : "border-line opacity-60"}`}
    >
      <ProductThumb product={p} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{p.brand}</p>
        <Link href={`/product/${p.id}`} className="line-clamp-2 text-sm font-medium leading-snug hover:text-plum">{p.name}</Link>
        <p className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
          <span className={`rounded-full px-2 py-0.5 ${m.exact ? "bg-good-soft text-good" : "bg-blush-100 text-plum"}`}>{m.exact ? "Exact match" : "Closest match"}</span>
          {improved !== undefined && <span className="rounded-full bg-blush-50 px-2 py-0.5 text-ink">{improved}% of twins improved</span>}
          {inPlan && <span className="rounded-full bg-blush-50 px-2 py-0.5 text-muted">In plan</span>}
        </p>
        {!m.exact && <p className="mt-1 truncate text-[10px] italic text-muted">from “{m.line}”</p>}
        <button onClick={save} className="mt-1 text-[10px] text-plum underline">{saved ? "In wishlist" : "Save to wishlist"}</button>
      </div>
      <button
        onClick={toggle}
        role="checkbox"
        aria-checked={on}
        aria-label={`Include ${p.name}`}
        className={`grid size-8 shrink-0 place-items-center self-center rounded-full border-2 transition ${on ? "border-plum bg-plum text-white" : "border-blush-300 text-transparent"}`}
      >
        <Check className="size-4" />
      </button>
    </motion.li>
  );
}
