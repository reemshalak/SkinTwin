"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanFace, Sparkles, X } from "lucide-react";
import { CONCERNS } from "@/lib/concerns";
import { predictMix } from "@/lib/mix";
import { productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { ConcernKey } from "@/lib/types";

// Live AR mirror: face tracking runs in this browser (MediaPipe), nothing is
// uploaded. Skin mode pins your measured scores to each zone; makeup mode
// paints a foundation or lip shade onto your face as you move.

const VERSION = "1.2.0";
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const MOUTH = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
const EYES = [
  [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
];
// Landmark each concern's label is pinned to, and which side it sits on (as you see yourself).
const PINS: Record<ConcernKey, [number, "l" | "r"]> = {
  texture: [109, "l"],
  oiliness: [168, "r"],
  wrinkle: [263, "r"],
  radiance: [116, "l"],
  pore: [4, "r"],
  moisture: [205, "l"],
  redness: [425, "r"],
  acne: [199, "l"],
};

type Mode = "skin" | "makeup";

// The tracker prints routine "INFO:" lines through console.error, which the
// dev overlay shows as errors. Drop just those.
let quieted = false;
function quietInfoLogs() {
  if (quieted) return;
  quieted = true;
  const error = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && /^(INFO|W\d{4}|I\d{4}):?/.test(args[0])) return;
    error(...args);
  };
}
type Landmarker = { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks: { x: number; y: number }[][] }; close: () => void };

function Mirror() {
  const params = useSearchParams();
  const { latest, routine } = useStore();
  const product = productById(params.get("product") ?? "");
  const shades = product?.shades ?? productById("solis-silk-foundation")!.shades!;
  const lipShades = productById("solis-silk-lip")!.shades!;
  const [mode, setMode] = useState<Mode>(product?.shades ? "makeup" : "skin");
  const [face, setFace] = useState(shades.find((s) => s.name === params.get("shade")) ?? (product?.id.includes("lip") ? null : shades[2]));
  const [lip, setLip] = useState(product?.id.includes("lip") ? (lipShades.find((s) => s.name === params.get("shade")) ?? lipShades[1]) : null);
  const [future, setFuture] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "on" | "denied" | "error">("idle");
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const opts = useRef({ mode, face, lip, future });
  opts.current = { mode, face, lip, future };

  const scores = latest?.scores;
  const delta = future && latest && routine.length ? predictMix(Array.from(new Set(routine.map((r) => r.productId))).slice(0, 3), latest.scores).delta : null;
  const values = useRef<{ scores?: typeof scores; delta: typeof delta }>({ scores, delta });
  values.current = { scores, delta };

  useEffect(() => {
    if (state !== "loading") return;
    let stream: MediaStream | null = null;
    let lm: Landmarker | null = null;
    let raf = 0;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
      } catch {
        return setState("denied");
      }
      try {
        quietInfoLogs();
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const files = await FilesetResolver.forVisionTasks(WASM);
        const make = (delegate: "GPU" | "CPU") => FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", numFaces: 1 });
        // Some browsers can't use the GPU path; the CPU one works everywhere, just slower.
        lm = (await make("GPU").catch(() => make("CPU"))) as unknown as Landmarker;
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        return setState("error");
      }
      if (stopped) return;
      const v = video.current!;
      v.srcObject = stream;
      await v.play();
      setState("on");
      const loop = () => {
        if (stopped) return;
        const c = canvas.current;
        if (c && v.readyState >= 2) {
          if (c.width !== v.videoWidth) {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
          }
          const pts = lm!.detectForVideo(v, performance.now()).faceLandmarks[0];
          draw(c, pts, opts.current, values.current);
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      lm?.close();
    };
  }, [state]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink text-white">
      <div className="relative flex-1 overflow-hidden">
        <video ref={video} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <p className="rounded-full bg-black/35 px-3 py-1.5 text-xs backdrop-blur">AR mirror · runs on your device</p>
          <Link href={product ? `/product/${product.id}` : "/me"} aria-label="Close" className="grid size-10 place-items-center rounded-full bg-black/35 backdrop-blur"><X className="size-5" /></Link>
        </div>

        {state !== "on" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="max-w-xs">
              <ScanFace className="mx-auto size-12 text-blush-200" />
              <p className="mt-3 font-display text-2xl">See your skin live</p>
              <p className="mt-1 text-sm text-white/75">Your scores and makeup shades follow your face. Video never leaves this device.</p>
              {state === "denied" && <p className="mt-3 text-xs text-blush-200">Camera access was blocked. Allow it in your browser settings.</p>}
              {state === "error" && <p className="mt-3 text-xs text-blush-200">Face tracking couldn&apos;t load on this browser. Try Chrome or Safari.</p>}
              <button onClick={() => setState("loading")} disabled={state === "loading"} className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 text-sm font-medium text-plum-deep disabled:opacity-70">
                {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} {state === "loading" ? "Starting…" : "Turn on camera"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3 bg-ink p-4 pb-6">
        <div role="tablist" className="mx-auto flex w-fit rounded-full bg-white/10 p-1 text-sm">
          {(["skin", "makeup"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full px-5 py-2 ${mode === m ? "bg-surface text-plum-deep" : "text-white/80"}`}>
              {m === "skin" ? "Skin" : "Makeup"}
            </button>
          ))}
        </div>
        {mode === "skin" ? (
          <div className="flex justify-center">
            {latest ? (
              routine.length > 0 && (
                <button onClick={() => setFuture((f) => !f)} aria-pressed={future} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs ${future ? "bg-good text-white" : "bg-white/10"}`}>
                  <Sparkles className="size-3.5" /> {future ? "Showing 6 weeks with your plan" : "Show 6 weeks with my plan"}
                </button>
              )
            ) : (
              <Link href="/scan" className="text-xs text-blush-200 underline">Scan first to see your scores here</Link>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Swatches label="Foundation" items={shades} value={face} onChange={setFace} />
            <Swatches label="Lips" items={lipShades} value={lip} onChange={setLip} />
          </div>
        )}
      </div>
    </div>
  );
}

function Swatches({ label, items, value, onChange }: { label: string; items: { name: string; hex: string }[]; value: { name: string } | null; onChange: (v: { name: string; hex: string } | null) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 text-[11px] text-white/70">{label}</span>
      <button onClick={() => onChange(null)} aria-pressed={!value} aria-label={`No ${label.toLowerCase()}`} className={`grid size-7 place-items-center rounded-full border text-[10px] ${!value ? "border-white" : "border-white/30 text-white/60"}`}>
        <X className="size-3" />
      </button>
      {items.map((s) => (
        <button key={s.name} onClick={() => onChange(s)} aria-pressed={value?.name === s.name} aria-label={s.name} className={`size-7 rounded-full border-2 ${value?.name === s.name ? "scale-110 border-white" : "border-transparent"}`} style={{ background: s.hex }} />
      ))}
    </div>
  );
}

function path(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], idx: number[], w: number, h: number) {
  ctx.moveTo(pts[idx[0]].x * w, pts[idx[0]].y * h);
  for (const i of idx.slice(1)) ctx.lineTo(pts[i].x * w, pts[i].y * h);
  ctx.closePath();
}

// The canvas is mirrored with the video, so text is drawn flipped back.
function draw(
  c: HTMLCanvasElement,
  pts: { x: number; y: number }[] | undefined,
  o: { mode: Mode; face: { hex: string } | null; lip: { hex: string } | null; future: boolean },
  vals: { scores?: Record<ConcernKey, number>; delta: Record<ConcernKey, number> | null },
) {
  const ctx = c.getContext("2d")!;
  const { width: w, height: h } = c;
  ctx.clearRect(0, 0, w, h);
  if (!pts) return;

  if (o.mode === "makeup") {
    if (o.face) {
      ctx.save();
      ctx.beginPath();
      path(ctx, pts, OVAL, w, h);
      for (const eye of EYES) path(ctx, pts, eye, w, h);
      path(ctx, pts, LIPS, w, h);
      ctx.filter = `blur(${Math.round(w / 90)}px)`;
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = o.face.hex;
      ctx.fill("evenodd");
      ctx.restore();
    }
    if (o.lip) {
      ctx.save();
      ctx.beginPath();
      path(ctx, pts, LIPS, w, h);
      path(ctx, pts, MOUTH, w, h);
      ctx.filter = "blur(1.5px)";
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = o.lip.hex;
      ctx.fill("evenodd");
      ctx.restore();
    }
    return;
  }

  if (!vals.scores) return;
  const fs = Math.max(14, Math.round(w / 38));
  ctx.font = `600 ${fs}px system-ui, sans-serif`;
  for (const [k, [i, side]] of Object.entries(PINS) as [ConcernKey, [number, "l" | "r"]][]) {
    const p = pts[i];
    const x = p.x * w;
    const y = p.y * h;
    const d = vals.delta?.[k] ?? 0;
    const text = vals.delta ? `${CONCERNS[k].label} ${Math.round(vals.scores[k] + d)}${d >= 1 ? ` +${Math.round(d)}` : ""}` : `${CONCERNS[k].label} ${vals.scores[k]}`;
    ctx.save();
    // Undo the mirror for text: flip around this point.
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    const tw = ctx.measureText(text).width + fs;
    const off = fs * 1.6;
    const bx = side === "l" ? -off - tw : off; // "l" = left as the user sees it
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, fs * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side === "l" ? bx + tw : bx, 0);
    ctx.stroke();
    ctx.fillStyle = vals.delta && d >= 1 ? "rgba(79,143,111,0.92)" : "rgba(58,36,48,0.72)";
    ctx.beginPath();
    ctx.roundRect(bx, -fs * 0.9, tw, fs * 1.8, fs * 0.9);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + fs / 2, 1);
    ctx.restore();
  }
}

export default function MirrorPage() {
  return (
    <Suspense>
      <Mirror />
    </Suspense>
  );
}
