"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { FaceAvatar } from "./FaceAvatar";
import { SAMPLE_FACES } from "@/lib/samples";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

// Try-on preview. In mock mode this is a simple tinted overlay; the API phase
// swaps the image for a YouCam Makeup VTO render of the chosen shade.
export function TryOn({ product }: { product: Product }) {
  const { latest } = useStore();
  const shades = product.shades!;
  const [shade, setShade] = useState(shades[Math.floor(shades.length / 2)]);
  const [on, setOn] = useState(true);
  const face = SAMPLE_FACES.find((s) => s.id === latest?.sampleId) ?? SAMPLE_FACES[2];
  const isLip = product.id.includes("lip");

  return (
    <section className="mt-5 rounded-[2rem] border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-medium">
          <Wand2 className="size-4 text-plum" /> Virtual try-on
        </h2>
        <button onClick={() => setOn((v) => !v)} className="text-xs text-plum underline-offset-4 hover:underline">
          {on ? "Show before" : "Show after"}
        </button>
      </div>
      <div className="relative mt-3 aspect-[4/5] overflow-hidden rounded-3xl">
        <FaceAvatar src={face.image} tone={face.tone} alt={`${face.name} wearing ${shade.name}`} className="absolute inset-0 h-full w-full" />
        {on && (
          <svg viewBox="0 0 100 120" className="absolute inset-0 h-full w-full mix-blend-multiply" aria-hidden>
            {isLip ? (
              <ellipse cx="50" cy="66" rx="8" ry="3" fill={shade.hex} opacity="0.75" />
            ) : (
              <ellipse cx="50" cy="50" rx="23" ry="28" fill={shade.hex} opacity="0.28" />
            )}
          </svg>
        )}
        <span className="glass absolute bottom-3 left-3 rounded-full px-3 py-1 text-[11px] text-white">
          {on ? shade.name : "Before"}
        </span>
      </div>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Shade">
        {shades.map((s) => (
          <button
            key={s.name}
            role="radio"
            aria-checked={shade.name === s.name}
            aria-label={s.name}
            onClick={() => {
              setShade(s);
              setOn(true);
            }}
            className={`size-9 rounded-full ring-offset-2 transition ${shade.name === s.name ? "ring-2 ring-plum" : ""}`}
            style={{ background: s.hex }}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted">Preview. Photo-real try-on uses YouCam Makeup VTO.</p>
    </section>
  );
}
