"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, Plus, RotateCcw, ScanFace, X } from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";
import { ProductVisual } from "./ProductArt";
import { saveLook, shrink } from "@/lib/looks";
import { PRODUCTS, productById } from "@/lib/products";
import { useStore } from "@/lib/store";

const SDK = "https://plugins-media.makeupar.com/v2.5-camera-kit/sdk.js";
type YMKApi = {
  init: (o: Record<string, unknown>) => void;
  openCameraKit: () => void;
  close: () => void;
  addEventListener: (ev: string, cb: (r: { images: { image: string | Blob }[] }) => void) => unknown;
};
declare global {
  interface Window {
    YMK?: YMKApi;
    YMKAsyncInit?: () => void;
  }
}

// Loads YouCam's Camera Kit script once.
function loadKit(): Promise<YMKApi> {
  return new Promise((resolve, reject) => {
    if (window.YMK) return resolve(window.YMK);
    window.YMKAsyncInit = () => resolve(window.YMK!);
    const s = document.createElement("script");
    s.src = SDK;
    s.async = true;
    s.onerror = () => reject(new Error("Camera Kit failed to load"));
    document.body.appendChild(s);
    setTimeout(() => (window.YMK ? resolve(window.YMK) : null), 4000);
  });
}

const toDataUrl = (img: string | Blob) =>
  typeof img !== "string"
    ? new Promise<string>((r) => {
        const fr = new FileReader();
        fr.onload = () => r(String(fr.result));
        fr.readAsDataURL(img);
      })
    : Promise.resolve(img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`);

type Pick = { productId: string; name: string; hex: string } | null;

// Capture with YouCam Camera Kit, then render real makeup with YouCam Makeup Try-On.
export function YouCamTryOn({ initialProduct, initialShade, onSkin }: { initialProduct?: string; initialShade?: string | null; onSkin: () => void }) {
  const { liveScans, addToRoutine, routine } = useStore();
  const makeup = PRODUCTS.filter((p) => p.shades);
  const lipP = makeup.find((p) => p.id.includes("lip"));
  const faceP = makeup.find((p) => !p.id.includes("lip"));
  const start = (id?: string): Pick => {
    const p = productById(id ?? "");
    const s = p?.shades?.find((x) => x.name === initialShade) ?? p?.shades?.[1];
    return p && s ? { productId: p.id, name: s.name, hex: s.hex } : null;
  };
  const [phase, setPhase] = useState<"intro" | "camera" | "result">("intro");
  const [err, setErr] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [lip, setLip] = useState<Pick>(initialProduct?.includes("lip") ? start(initialProduct) : null);
  const [face, setFace] = useState<Pick>(initialProduct && !initialProduct.includes("lip") ? start(initialProduct) : null);
  const [renders, setRenders] = useState<Record<string, { busy?: boolean; image?: string; note?: string }>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const kit = useRef<YMKApi | null>(null);
  const key = `${face?.hex ?? "-"}|${lip?.hex ?? "-"}`;
  const current = renders[key];

  async function openCamera() {
    setErr(null);
    setPhase("camera");
    try {
      const ymk = await loadKit();
      kit.current = ymk;
      ymk.addEventListener("faceDetectionCaptured", async (r) => {
        const first = r.images?.[0]?.image;
        if (!first) return;
        setPhoto(await toDataUrl(first));
        setRenders({});
        ymk.close();
        setPhase("result");
      });
      ymk.init({ faceDetectionMode: "makeup", imageFormat: "base64", language: "enu", width: Math.min(480, window.innerWidth - 32), height: Math.min(640, window.innerHeight - 220) });
      ymk.openCameraKit();
    } catch {
      setErr("YouCam's camera couldn't load. Check your connection and try again.");
      setPhase("intro");
    }
  }
  useEffect(() => () => kit.current?.close(), []);

  // Render the current picks with YouCam (cached per shade combo).
  useEffect(() => {
    if (phase !== "result" || !photo || (!face && !lip) || renders[key]) return;
    setRenders((r) => ({ ...r, [key]: { busy: true } }));
    fetch("/api/makeup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: photo, live: liveScans, foundation: face && { hex: face.hex, strength: 0.6 }, lip: lip && { hex: lip.hex, strength: 0.75 } }),
    })
      .then((r) => r.json())
      .catch(() => ({}))
      .then((d: { image?: string; note?: string }) => setRenders((r) => ({ ...r, [key]: { image: d.image, note: d.note } })));
  }, [phase, photo, face, lip, key, renders, liveScans]);

  async function keep() {
    if (!photo) return;
    const ok = saveLook({
      id: Date.now().toString(36),
      createdAt: new Date().toISOString(),
      image: await shrink(current?.image ?? photo),
      before: await shrink(photo, 240),
      source: current?.image ? "youcam" : "preview",
      products: [face, lip].filter(Boolean).map((p) => ({ id: p!.productId, shade: p!.name, hex: p!.hex })),
    });
    setSaved(ok ? key : "full");
  }

  const ShadeRow = ({ p, value, set }: { p: NonNullable<typeof lipP>; value: Pick; set: (v: Pick) => void }) => (
    <div className="rounded-2xl bg-white/8 p-3">
      <div className="flex items-center gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${p.hue}`}><ProductVisual product={p} className="h-[85%] w-[85%]" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] uppercase tracking-wider text-white/50">{p.brand}</span>
          <span className="block truncate text-sm">{p.name}</span>
        </span>
        <span className="text-xs text-white/60">${p.price}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button onClick={() => set(null)} aria-pressed={!value} className={`grid size-8 place-items-center rounded-full border ${!value ? "border-white" : "border-white/30 text-white/50"}`}><X className="size-3.5" /></button>
        {p.shades!.map((s) => {
          const on = value?.name === s.name;
          return (
            <button key={s.name} onClick={() => set({ productId: p.id, name: s.name, hex: s.hex })} aria-pressed={on} className="flex flex-col items-center gap-0.5">
              <motion.span animate={{ scale: on ? 1.15 : 1 }} className={`block size-8 rounded-full border-2 ${on ? "border-white shadow-[0_0_0_3px_rgba(229,143,176,0.6)]" : "border-transparent"}`} style={{ background: s.hex }} />
              <span className={`text-[9px] ${on ? "text-white" : "text-white/50"}`}>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const picked = [face, lip].filter(Boolean) as NonNullable<Pick>[];
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-gradient-to-b from-[#3a1d33] to-[#1c1216] text-white">
      <div className="flex items-center justify-between p-4">
        <div role="tablist" className="flex rounded-full bg-white/10 p-1 text-sm">
          <button role="tab" aria-selected={false} onClick={onSkin} className="rounded-full px-4 py-1.5 text-white/80">Skin</button>
          <button role="tab" aria-selected className="rounded-full bg-surface px-4 py-1.5 text-plum-deep">Makeup</button>
        </div>
        <Link href="/journal#looks" aria-label="Close" className="grid size-10 place-items-center rounded-full bg-black/35"><X className="size-5" /></Link>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-8">
        {/* Vanity glass */}
        <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-black/40 ring-4 ring-blush-100/60 shadow-[0_0_60px_rgba(240,170,200,0.25)]">
          {phase === "camera" && <div id="YMK-module" className="absolute inset-0 [&_canvas]:!h-full [&_canvas]:!w-full [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover" />}
          {phase === "intro" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <ScanFace className="mx-auto size-12 text-blush-200" />
                <p className="mt-3 font-display text-2xl">Try makeup on you</p>
                <p className="mt-1 text-sm text-white/70">YouCam&apos;s camera guides you to good light and a straight angle, then snaps automatically.</p>
                {err && <p className="mt-2 text-xs text-blush-200">{err}</p>}
                <button onClick={openCamera} className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 text-sm font-medium text-plum-deep"><Camera className="size-4" /> Open YouCam camera</button>
              </div>
            </div>
          )}
          {phase === "result" && photo && (
            <>
              {current?.image ? (
                <BeforeAfter before={photo} after={current.image} labels={["Before", picked.map((p) => p.name).join(" + ") || "After"]} className="absolute inset-0" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your photo" className="absolute inset-0 h-full w-full object-cover" />
              )}
              {current?.busy && (
                <div className="absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-[1px]">
                  <span className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm"><Loader2 className="size-4 animate-spin" /> YouCam is applying {picked.map((p) => p.name).join(" + ")}…</span>
                </div>
              )}
            </>
          )}
        </div>
        {phase === "result" && (
          <p className="mt-2 text-center text-[11px] text-white/60">
            {current?.image ? "Rendered by YouCam Makeup Try-On with the product's real shade." : !picked.length ? "Pick a shade below." : current?.note ?? (liveScans ? "" : "Demo mode: turn on YouCam live in Settings to render this shade on your photo.")}
          </p>
        )}

        {phase !== "camera" && (
          <div className="mt-4 space-y-3">
            {faceP && <ShadeRow p={faceP} value={face} set={setFace} />}
            {lipP && <ShadeRow p={lipP} value={lip} set={setLip} />}
          </div>
        )}

        <AnimatePresence>
          {phase === "result" && picked.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
              {picked.map((p) => {
                const prod = productById(p.productId)!;
                const inPlan = routine.some((r) => r.productId === prod.id);
                return (
                  <div key={p.productId} className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-ink">
                    <span className="size-6 rounded-full border-2 border-white shadow" style={{ background: p.hex }} />
                    <span className="min-w-0 flex-1 text-sm"><b className="font-medium">{prod.name}</b> · {p.name}</span>
                    <Link href={`/product/${prod.id}`} className="rounded-full border border-line px-3 py-1.5 text-xs text-plum">View</Link>
                    <button onClick={() => !inPlan && addToRoutine(prod.id, "am")} disabled={inPlan} className="inline-flex items-center gap-1 rounded-full bg-plum-deep px-3 py-1.5 text-xs text-white disabled:bg-good">
                      {inPlan ? <Check className="size-3.5" /> : <Plus className="size-3.5" />} {inPlan ? "In plan" : "Plan"}
                    </button>
                  </div>
                );
              })}
              <div className="flex gap-2 pt-1">
                <button onClick={keep} disabled={saved === key || current?.busy} className="flex-1 rounded-full bg-rose py-3 text-sm font-medium text-white disabled:opacity-70">
                  {saved === key ? "Saved to My looks ✓" : saved === "full" ? "Storage full" : "Save to My looks"}
                </button>
                <button onClick={openCamera} className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 text-xs"><RotateCcw className="size-3.5" /> Retake</button>
              </div>
              {saved === key && <Link href="/journal#looks" className="block text-center text-xs text-blush-200 underline">See it in My looks →</Link>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
