"use client";

import { dateFormat } from "@/lib/i18n-core";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Camera, Download, Trash2 } from "lucide-react";
import { deleteLook, loadLooks, type Look } from "@/lib/looks";
import { productById } from "@/lib/products";

const DATE = dateFormat({ day: "numeric", month: "short" });

// Looks you captured in the try-on mirror, pinned like polaroids.
export function MyLooks() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [open, setOpen] = useState<Look | null>(null);
  useEffect(() => setLooks(loadLooks()), []);

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <span className="inline-block -rotate-1 rounded-sm bg-blush-200/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-plum-deep">My looks</span>
          <h2 className="mt-1 font-display text-2xl text-ink">Shades I tried on</h2>
        </div>
        <Link href="/mirror" className="inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2.5 text-sm text-white hover:bg-plum">
          <Camera className="size-4" /> Try on makeup
        </Link>
      </div>
      {looks.length === 0 ? (
        <p className="rounded-[1.75rem] border-2 border-dashed border-plum/25 p-8 text-center text-sm text-muted">
          No looks yet. Open the mirror, pick a shade, tap capture, then save it here.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {looks.map((l, i) => (
            <motion.li key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ rotate: `${(i % 3) - 1}deg` }}>
              <button onClick={() => setOpen(l)} className="relative block w-full bg-white p-2 pb-9 text-start shadow-card transition hover:rotate-0 hover:shadow-soft">
                <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-2 bg-rose/30" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.image} alt="" className="aspect-[3/4] w-full -scale-x-100 object-cover" />
                <span className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
                  {l.products.map((p) => <span key={p.id} title={p.shade} className="size-3.5 rounded-full border border-white shadow" style={{ background: p.hex }} />)}
                  <span className="ms-auto font-display text-xs text-plum-deep">{DATE.format(new Date(l.createdAt))}</span>
                </span>
                {l.source === "youcam" && <span className="absolute top-3 start-3 rounded-full bg-black/45 px-2 py-0.5 text-[9px] text-white">YouCam</span>}
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-[2rem] bg-surface p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.image} alt="Saved look" className="aspect-[3/4] w-full -scale-x-100 rounded-2xl object-cover" />
              <ul className="mt-3 space-y-1.5">
                {open.products.map((p) => (
                  <li key={p.id}>
                    <Link href={`/product/${p.id}`} className="flex items-center gap-2 text-sm hover:text-plum">
                      <span className="size-4 rounded-full border border-line" style={{ background: p.hex }} /> {productById(p.id)?.name} · {p.shade}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted">{open.source === "youcam" ? "Rendered by YouCam Makeup Try-On." : "App preview (demo mode)."}</p>
              <div className="mt-3 flex gap-2">
                <a href={open.image} download={`skintwin-look-${open.id}.jpg`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-plum-deep py-2.5 text-xs text-white"><Download className="size-3.5" /> Save image</a>
                <button
                  onClick={() => {
                    deleteLook(open.id);
                    setLooks(loadLooks());
                    setOpen(null);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-line px-4 text-xs text-muted hover:text-bad"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
