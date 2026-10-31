"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Camera, Check, Users, Wand2 } from "lucide-react";
import { portraitPath } from "@/lib/people";
import { closestShade, rgbToHex, skinColorOf, twinShadePicks } from "@/lib/shade";
import { useStore } from "@/lib/store";
import { outcomeFor } from "@/lib/twins";
import type { Product } from "@/lib/types";
import { useTwins } from "@/lib/use-twins";

// Skin-first makeup: your shade from your own photo, what your twins wear,
// whether it broke them out, and a preview on your face (live in the AR mirror).
export function TryOn({ product }: { product: Product }) {
  const { latest } = useStore();
  const { twins, featured } = useTwins();
  const shades = product.shades!;
  const isLip = product.id.includes("lip");
  const photo = latest?.photo?.startsWith("data:") || latest?.photo === portraitPath("amara") ? latest!.photo! : portraitPath("amara");
  const [tone, setTone] = useState<string | null>(null);
  const [shade, setShade] = useState(shades[Math.floor(shades.length / 2)]);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    if (isLip) return;
    skinColorOf(photo).then((rgb) => {
      if (!rgb) return;
      setTone(rgbToHex(rgb));
      if (!picked) setShade(closestShade(rgb, shades));
    });
    // Only when the photo changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, isLip]);

  const match = tone ? closestShade([1, 3, 5].map((i) => parseInt(tone.slice(i, i + 2), 16)) as [number, number, number], shades) : null;
  const picks = useMemo(() => (isLip ? [] : twinShadePicks(featured, shades)), [featured, shades, isLip]);
  const o = outcomeFor(product.id, twins);
  const most = Math.max(1, ...picks.map((p) => p.n));

  return (
    <section className="mt-5 rounded-[2rem] border border-line bg-surface p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-medium">
        <Wand2 className="size-4 text-plum" /> {isLip ? "Try a tint" : "Your shade"}
      </h2>

      <div className="mt-3 grid grid-cols-[7rem_1fr] gap-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-blush-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Preview on your face" className="h-full w-full object-cover" />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{
              background: isLip
                ? `radial-gradient(ellipse 12% 4% at 50% 67%, ${shade.hex} 55%, transparent 100%)`
                : `radial-gradient(ellipse 34% 40% at 50% 52%, ${shade.hex} 55%, transparent 100%)`,
              opacity: isLip ? 0.75 : 0.35,
            }}
          />
        </div>
        <div className="min-w-0">
          {match && (
            <p className="flex items-center gap-2 text-xs">
              <span className="size-5 rounded-full border border-line" style={{ background: tone! }} />
              Your skin tone matches <b className="font-medium">{match.name}</b>
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {shades.map((s) => (
              <button
                key={s.name}
                onClick={() => { setShade(s); setPicked(true); }}
                aria-pressed={shade.name === s.name}
                aria-label={s.name}
                className={`relative size-9 rounded-full border-2 transition ${shade.name === s.name ? "scale-110 border-plum" : "border-surface shadow-card"}`}
                style={{ background: s.hex }}
              >
                {match?.name === s.name && <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" />}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted">{shade.name}</p>
          {twins.length > 0 && o.n >= 5 && (
            <p className={`mt-3 rounded-xl px-2.5 py-1.5 text-[11px] ${o.worsenedPct >= 20 ? "bg-warn-soft text-warn" : "bg-good-soft text-good"}`}>
              {o.worsenedPct >= 20 ? `${o.worsenedPct}% of your twins broke out or reacted` : `Skin-safe for ${100 - o.worsenedPct}% of your twins`}
            </p>
          )}
        </div>
      </div>

      {picks.some((p) => p.n) && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[11px] text-muted"><Users className="size-3.5" /> What your closest twins wear</p>
          <ul className="mt-2 space-y-1">
            {picks.map(({ shade: s, n }) => (
              <li key={s.name} className="flex items-center gap-2 text-[11px]">
                <span className="size-3 rounded-full" style={{ background: s.hex }} />
                <span className="w-24 truncate">{s.name}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-blush-100">
                  <span className="block h-full rounded-full bg-plum" style={{ width: `${(n / most) * 100}%` }} />
                </span>
                <span className="w-4 text-end text-muted">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href={`/mirror?product=${product.id}&shade=${encodeURIComponent(shade.name)}`} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-plum-deep py-3 text-sm text-white hover:bg-plum">
        <Camera className="size-4" /> Try it live on camera
      </Link>
    </section>
  );
}
