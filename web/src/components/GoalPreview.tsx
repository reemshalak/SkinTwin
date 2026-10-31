"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";
import { HAS_AFTER, HAS_PORTRAIT, afterPath, portraitPath } from "@/lib/people";
import { useStore } from "@/lib/store";
import type { ConcernKey, SkinProfile } from "@/lib/types";

// What YouCam Skin Simulation can render; hydration and oil show their nearest visible effect.
const VISIBLE: Record<ConcernKey, string[]> = {
  wrinkle: ["wrinkle"], radiance: ["radiance"], acne: ["acne"], pore: ["pores"], texture: ["texture"], redness: ["redness"],
  moisture: ["texture", "wrinkle"], oiliness: ["pores", "acne"],
};
const DEMO_AFTER = { filter: "saturate(1.05) brightness(1.05) contrast(0.95) blur(0.2px)" };

// "See me at my goal": your photo now vs. a render of the goal reached.
export function GoalPreview({ scan, concern, gain }: { scan: SkinProfile; concern: ConcernKey; gain: number }) {
  const { liveScans } = useStore();
  const [state, setState] = useState<{ busy?: boolean; image?: string; note?: string; shown?: boolean }>({});
  const own = scan.photo?.startsWith("data:") || (scan.photo && HAS_PORTRAIT.has(scan.photo.replace(/^\/people\/|\.jpg$/g, "")));
  const photo = own ? scan.photo! : portraitPath("amara");
  // A sample person has a real eight-weeks-later photo to show in demo mode.
  const sampleId = !scan.photo?.startsWith("data:") ? (scan.photo?.match(/\/people\/([a-z]+)\.jpg$/)?.[1] ?? (own ? undefined : "amara")) : undefined;
  const sampleAfter = sampleId && HAS_AFTER.has(sampleId) ? afterPath(sampleId) : undefined;

  async function show() {
    setState({ busy: true, shown: true });
    const strength = Math.min(0.9, Math.max(0.3, gain / 6));
    const intensities = Object.fromEntries(VISIBLE[concern].map((k) => [k, strength]));
    const body = photo.startsWith("data:") ? { imageDataUrl: photo } : { sampleId: own ? scan.sampleId : "amara" };
    const res = await fetch("/api/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, intensities, live: liveScans }) }).catch(() => null);
    const data = ((await res?.json().catch(() => ({}))) ?? {}) as { image?: string; note?: string };
    setState({ shown: true, image: data.image, note: data.note });
  }

  if (!state.shown) {
    return (
      <button type="button" onClick={show} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-plum/40 bg-surface py-2.5 text-sm text-plum hover:border-plum">
        <Sparkles className="size-4" /> See me at my goal
      </button>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 overflow-hidden">
      {state.busy ? (
        <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-blush-100 text-sm text-plum">
          <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> {liveScans ? "YouCam is rendering your goal…" : "Preparing preview…"}</span>
        </div>
      ) : (
        <>
          <BeforeAfter before={photo} after={state.image ?? (sampleAfter ?? photo)} afterStyle={state.image || sampleAfter ? undefined : DEMO_AFTER} labels={["Now", "At my goal"]} className="aspect-[4/3] rounded-2xl" />
          <p className="mt-1.5 text-[11px] text-muted">
            {state.image ? "Rendered by YouCam AI Skin Simulation." : state.note ?? (liveScans ? "YouCam was unavailable, so this is a styled preview." : "Demo preview. Turn on YouCam live in Settings for a real render of your goal.")}
          </p>
        </>
      )}
    </motion.div>
  );
}
