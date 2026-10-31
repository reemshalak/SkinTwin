"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Camera, Loader2, MoveHorizontal, ScanFace, ShoppingBag, Sparkles, X, Zap } from "lucide-react";
import { CONCERNS } from "@/lib/concerns";
import { predictMix } from "@/lib/mix";
import { PRODUCTS, productById } from "@/lib/products";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { saveLook, shrink } from "@/lib/looks";
import { YouCamTryOn } from "@/components/YouCamTryOn";
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
  const { latest, routine, liveScans } = useStore();
  const product = productById(params.get("product") ?? "");
  const shadeParam = params.get("shade");
  // Only real products' shades: one row per makeup product.
  const makeup = PRODUCTS.filter((p) => p.shades);
  const isLip = (p: Product) => p.id.includes("lip");
  const initial = (p: Product) => (product?.id === p.id ? (p.shades!.find((s) => s.name === shadeParam) ?? p.shades![1]) : null);
  const [mode, setMode] = useState<Mode>(product?.shades ? "makeup" : "skin");
  const [picks, setPicks] = useState<Record<string, { name: string; hex: string } | null>>(() => Object.fromEntries(makeup.map((p) => [p.id, initial(p)])));
  const [strength, setStrength] = useState(0.6);
  const [shot, setShot] = useState<{ before: string; after?: string; preview: string; busy: boolean; live: boolean; note?: string } | null>(null);
  const [split, setSplit] = useState(50);
  const [saved, setSaved] = useState<"idle" | "saving" | "done" | "full">("idle");
  const wearing = makeup.filter((p) => picks[p.id]).map((p) => ({ id: p.id, shade: picks[p.id]!.name, hex: picks[p.id]!.hex }));
  async function keepLook() {
    if (!shot) return;
    setSaved("saving");
    const ok = saveLook({
      id: Date.now().toString(36),
      createdAt: new Date().toISOString(),
      image: await shrink(shot.after ?? shot.preview),
      before: await shrink(shot.before, 240),
      source: shot.after ? "youcam" : "preview",
      products: wearing,
    });
    setSaved(ok ? "done" : "full");
  }
  const face = makeup.filter((p) => !isLip(p)).map((p) => picks[p.id]).find(Boolean) ?? null;
  const lip = makeup.filter(isLip).map((p) => picks[p.id]).find(Boolean) ?? null;
  const [future, setFuture] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "on" | "denied" | "error">("idle");
  const [run, setRun] = useState(0); // bumps each time you tap "Turn on camera"
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const opts = useRef({ mode, face, lip, future, strength });
  opts.current = { mode, face, lip, future, strength };
  const lastPts = useRef<{ x: number; y: number }[] | undefined>(undefined);

  const scores = latest?.scores;
  const delta = future && latest && routine.length ? predictMix(Array.from(new Set(routine.map((r) => r.productId))).slice(0, 3), latest.scores).delta : null;
  const values = useRef<{ scores?: typeof scores; delta: typeof delta }>({ scores, delta });
  values.current = { scores, delta };

  // Keyed on `run`, not the status, so the camera isn't torn down when it turns on.
  useEffect(() => {
    if (!run) return;
    setState("loading");
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
          const raw = lm!.detectForVideo(v, performance.now()).faceLandmarks[0];
          // Blend with the last frame to stop the overlay jittering.
          const prev = lastPts.current;
          const move = raw && prev ? Math.hypot(raw[1].x - prev[1].x, raw[1].y - prev[1].y) : 1;
          const k = Math.min(1, 0.6 + move * 80); // still: smooth out jitter; moving: follow at once
          const pts = raw && prev ? raw.map((p, i) => ({ x: prev[i].x * (1 - k) + p.x * k, y: prev[i].y * (1 - k) + p.y * k })) : raw;
          lastPts.current = pts;
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
  }, [run]);

  // Snapshot the current frame, paint the app's preview on it, and ask YouCam for a real render.
  async function capture() {
    const v = video.current;
    const pts = lastPts.current;
    if (!v || !pts || (!face && !lip)) return;
    const scale = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const before = c.toDataURL("image/jpeg", 0.9);
    paintMakeup(ctx, pts, c.width, c.height, { face, lip, strength });
    const preview = c.toDataURL("image/jpeg", 0.9);
    setSplit(50);
    setSaved("idle");
    setShot({ before, preview, busy: true, live: liveScans });
    const res = await fetch("/api/makeup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: before, live: liveScans, foundation: face && { hex: face.hex, strength }, lip: lip && { hex: lip.hex, strength } }),
    });
    const data = (await res.json().catch(() => ({}))) as { image?: string; note?: string };
    setShot((s) => s && { ...s, busy: false, after: data.image, note: data.note });
  }

  if (mode === "makeup") return <YouCamTryOn initialProduct={product?.id} initialShade={shadeParam} onSkin={() => setMode("skin")} />;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#1c1216] text-white">
      <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-plum-deep to-[#1c1216]">
        {/* Vanity mirror: an arched glass with soft bulbs around it */}
        <div className="absolute inset-x-4 top-14 bottom-3 mx-auto max-w-md sm:inset-x-0">
          <div className="absolute -inset-3 rounded-t-[999px] rounded-b-[2.5rem] bg-gradient-to-b from-blush-200/40 to-rose/20 shadow-[0_0_60px_rgba(240,170,200,0.25)]" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = Math.PI + (i / 11) * Math.PI;
            return <span key={i} aria-hidden className="absolute size-2.5 rounded-full bg-[#fff4e0] shadow-[0_0_12px_4px_rgba(255,236,200,0.7)]" style={{ left: `${50 + Math.cos(a) * 52}%`, top: `${Math.min(38, 30 + Math.sin(a) * 34)}%` }} />;
          })}
          <div className="absolute inset-0 overflow-hidden rounded-t-[999px] rounded-b-[2rem] ring-4 ring-blush-100/70">
            <video ref={video} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15" />
            {wearing.length > 0 && state === "on" && (
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap justify-center gap-2">
                {wearing.map((w) => (
                  <Link key={w.id} href={`/product/${w.id}`} className="flex items-center gap-2 rounded-full bg-black/45 py-1 ps-1 pe-3 text-[11px] backdrop-blur">
                    <span className="size-5 rounded-full border-2 border-white" style={{ background: w.hex }} />
                    <span><span className="block leading-tight">{productById(w.id)?.name}</span><span className="text-white/70">{w.shade} · {productById(w.id)?.brand}</span></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <p className="rounded-full bg-black/35 px-3 py-1.5 text-xs backdrop-blur">Try-on mirror · {liveScans ? "capture renders with YouCam" : "demo preview"}</p>
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
              <button onClick={() => setRun((n) => n + 1)} disabled={state === "loading"} className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 text-sm font-medium text-plum-deep disabled:opacity-70">
                {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} {state === "loading" ? "Starting…" : "Turn on camera"}
              </button>
            </div>
          </div>
        )}
      </div>

      {shot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => !shot.busy && setShot(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-[2rem] bg-[#1c1216] p-4 sm:rounded-[2rem]">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.after ?? shot.preview} alt="With makeup" className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.before} alt="Before" className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${split}%` }}>
                <span className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-plum"><MoveHorizontal className="size-4" /></span>
              </div>
              <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-label="Compare" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
              <span className="absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] backdrop-blur">Before</span>
              <span className="absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] backdrop-blur">{shot.busy ? "Rendering with YouCam…" : shot.after ? "YouCam render" : "App preview"}</span>
              {shot.busy && <Loader2 className="absolute inset-0 m-auto size-8 animate-spin text-white/80" />}
            </div>
            {saved === "done" && <Link href="/journal#looks" className="mt-2 block text-center text-xs text-blush-200 underline">See it in My looks →</Link>}
            <p className="mt-3 text-[11px] text-white/70">
              {shot.after ? "Rendered by YouCam Makeup Try-On with the product's real shade." : shot.live ? (shot.note ?? "") : "Demo mode: this is the app's preview. Turn on YouCam live in Settings for a realistic render."}
            </p>
            <div className="mt-3 flex gap-2">
              {makeup.filter((p) => picks[p.id]).map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-surface py-2.5 text-xs text-plum-deep">
                  <ShoppingBag className="size-3.5" /> {isLip(p) ? "Lip" : "Foundation"} · {picks[p.id]!.name}
                </Link>
              ))}
              <button onClick={keepLook} disabled={shot.busy || saved === "saving" || saved === "done"} className="rounded-full bg-rose px-4 text-xs font-medium text-white disabled:opacity-70">
                {saved === "done" ? "Saved ✓" : saved === "full" ? "Storage full" : "Save to My looks"}
              </button>
              <button onClick={() => setShot(null)} disabled={shot.busy} className="rounded-full border border-white/30 px-4 text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3 bg-[#1c1216] p-4 pb-6">
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
          <div className="mx-auto max-w-xl space-y-3">
            {makeup.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Link href={`/product/${p.id}`} className="w-36 shrink-0 text-[11px] leading-tight text-white/80 hover:text-white">
                  <span className="block text-[9px] uppercase tracking-wider text-white/50">{p.brand}</span>
                  {p.name}
                </Link>
                <Swatches label={p.name} items={p.shades!} value={picks[p.id]} onChange={(v) => setPicks((cur) => ({ ...cur, [p.id]: v }))} />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <label htmlFor="strength" className="w-36 shrink-0 text-[11px] text-white/80">Strength · {strength < 0.4 ? "sheer" : strength < 0.75 ? "medium" : "full"}</label>
              <input id="strength" type="range" min={0.15} max={1} step={0.05} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="flex-1 accent-[var(--color-rose)]" />
            </div>
            <button onClick={capture} disabled={state !== "on" || (!face && !lip)} className="flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3 text-sm font-medium text-plum-deep disabled:opacity-50">
              <Zap className="size-4" /> {liveScans ? "Capture & render with YouCam" : "Capture & compare"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Swatches({ label, items, value, onChange }: { label: string; items: { name: string; hex: string }[]; value: { name: string } | null; onChange: (v: { name: string; hex: string } | null) => void }) {
  return (
    <div className="flex items-center gap-1.5">
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

// Foundation over the face (not eyes or mouth) and lip colour inside the lip line.
function paintMakeup(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  w: number,
  h: number,
  o: { face: { hex: string } | null; lip: { hex: string } | null; strength: number },
) {
  if (o.face) {
    ctx.save();
    ctx.beginPath();
    path(ctx, pts, OVAL, w, h);
    for (const eye of EYES) path(ctx, pts, eye, w, h);
    path(ctx, pts, LIPS, w, h);
    ctx.filter = `blur(${Math.round(w / 70)}px)`;
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.25 + o.strength * 0.5;
    ctx.fillStyle = o.face.hex;
    ctx.fill("evenodd");
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = o.strength * 0.18;
    ctx.fill("evenodd");
    ctx.restore();
  }
  if (o.lip) {
    ctx.save();
    ctx.beginPath();
    path(ctx, pts, LIPS, w, h);
    path(ctx, pts, MOUTH, w, h);
    ctx.clip("evenodd");
    ctx.filter = `blur(${Math.max(1, Math.round(w / 500))}px)`;
    ctx.globalCompositeOperation = "color"; // shade's hue, your lips' light and texture
    ctx.globalAlpha = 0.55 + o.strength * 0.4;
    ctx.fillStyle = o.lip.hex;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.25 + o.strength * 0.35;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

// The canvas is mirrored with the video, so text is drawn flipped back.
function draw(
  c: HTMLCanvasElement,
  pts: { x: number; y: number }[] | undefined,
  o: { mode: Mode; face: { hex: string } | null; lip: { hex: string } | null; future: boolean; strength: number },
  vals: { scores?: Record<ConcernKey, number>; delta: Record<ConcernKey, number> | null },
) {
  const ctx = c.getContext("2d")!;
  const { width: w, height: h } = c;
  ctx.clearRect(0, 0, w, h);
  if (!pts) return;

  if (o.mode === "makeup") return paintMakeup(ctx, pts, w, h, o);

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
