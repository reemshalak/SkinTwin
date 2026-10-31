"use client";

import { TrendMark } from "@/components/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, FlaskConical, Loader2, MoveHorizontal, Plus, Sparkles, Users, X, Zap } from "lucide-react";
import { EASE } from "@/components/motion";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { ProductVisual } from "@/components/ProductArt";
import { CONCERN_KEYS, CONCERNS } from "@/lib/concerns";
import { predictMix, simulationIntensities, twinsWhoTried } from "@/lib/mix";
import { HAS_PORTRAIT, portraitPath } from "@/lib/people";
import { PRODUCTS, productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { ConcernKey, Scores } from "@/lib/types";
import { useTwins } from "@/lib/use-twins";
import { ZONES } from "@/lib/zones";

const MAX = 3;
const VERDICT = {
  great: { label: "Great combo", cls: "from-good to-[#3f7a5c]", icon: Sparkles },
  good: { label: "Good combo", cls: "from-blush-400 to-plum", icon: Check },
  meh: { label: "Not much change", cls: "from-[#b3a2ab] to-[#8c7682]", icon: FlaskConical },
  clash: { label: "Clash!", cls: "from-warn to-bad", icon: AlertTriangle },
} as const;

function MixLab() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, latest, routine, addToRoutine, liveScans } = useStore();
  const { twins } = useTwins();
  const [ids, setIds] = useState<string[]>([]);
  const [split, setSplit] = useState(50);
  const [over, setOver] = useState(false);
  const [sim, setSim] = useState<{ key: string; image?: string; busy?: boolean; note?: string } | null>(null);
  const faceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = params.get("ids");
    if (q) setIds(q.split(",").filter((id) => productById(id)).slice(0, MAX));
    else if (routine.length) setIds(routine.map((r) => r.productId).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2));
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mix = useMemo(() => (latest && ids.length ? predictMix(ids, latest.scores) : null), [ids, latest]);
  const tried = useMemo(() => (ids.length >= 2 ? twinsWhoTried(ids, twins) : null), [ids, twins]);

  if (!ready) return null;
  if (!latest) return <NeedScan what="combo previews" />;

  // Your own scan photo; a sample face if it was removed or never generated.
  const ownPhoto = latest.photo?.startsWith("data:") || (latest.photo && HAS_PORTRAIT.has(latest.photo.replace(/^\/people\/|\.jpg$/g, "")));
  const photo = ownPhoto ? latest.photo! : portraitPath("amara");
  const usingSample = !ownPhoto;
  const simKey = ids.slice().sort().join(",");
  const realPreview = sim?.key === simKey ? sim.image : undefined;

  function add(id: string) {
    setIds((cur) => (cur.includes(id) ? cur : [...cur, id].slice(-MAX)));
  }
  function remove(id: string) {
    setIds((cur) => cur.filter((x) => x !== id));
  }
  // A drag counts as a drop when it ends over the face.
  function inFace(info: PanInfo) {
    const r = faceRef.current?.getBoundingClientRect();
    if (!r) return false;
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  async function youcamPreview() {
    if (!mix) return;
    setSim({ key: simKey, busy: true });
    const body = photo.startsWith("data:") ? { imageDataUrl: photo } : { sampleId: ownPhoto ? latest!.sampleId : "amara" };
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, intensities: simulationIntensities(mix.delta), live: liveScans }),
    });
    const data = (await res.json().catch(() => ({}))) as { image?: string; note?: string; demo?: boolean };
    setSim({ key: simKey, image: data.image, note: data.image ? undefined : data.note ?? (liveScans ? "YouCam preview was unavailable." : undefined) });
  }

  function addCombo() {
    for (const id of ids) {
      const p = productById(id)!;
      addToRoutine(id, p.slot === "am" ? "am" : "pm");
    }
    router.push("/routine");
  }

  const v = mix ? VERDICT[mix.verdict] : null;

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">Preview a combo · YouCam Skin Simulation</p>
          <h1 className="mt-1 font-display text-3xl text-ink lg:text-4xl">Drop products on your face</h1>
          <p className="mt-1 text-sm text-muted">See what a combo could do in 6 weeks, before you buy.</p>
        </div>
        <Link href="/swipe" className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-plum">Quick pick</Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        {/* Face */}
        <section>
          <div
            ref={faceRef}
            className={`relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-blush-100 transition ${over ? "ring-4 ring-rose ring-offset-4 ring-offset-blush-50" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Your face before" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            {mix && (
              <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
                {realPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={realPreview} alt="YouCam preview after" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                ) : (
                  <AppPreview photo={photo} delta={mix.delta} />
                )}
              </div>
            )}

            {mix && (
              <>
                <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }}>
                  <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-plum shadow-card">
                    <MoveHorizontal className="size-4" />
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  aria-label="Compare before and after"
                  className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                />
                <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] text-white backdrop-blur">Now</span>
                <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] text-white backdrop-blur">
                  {realPreview ? "YouCam · 6 weeks" : "6 weeks"}
                </span>
                <Markers delta={mix.delta} />
              </>
            )}

            {!ids.length && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25 text-center text-white">
                <p className="px-8 font-display text-xl">Drag a product here<span className="block text-xs font-sans opacity-80">or tap one below</span></p>
              </div>
            )}
          </div>

          {/* Slots */}
          <div className="mx-auto mt-4 flex max-w-md justify-center gap-3">
            {Array.from({ length: MAX }, (_, i) => {
              const id = ids[i];
              const p = id ? productById(id) : undefined;
              return (
                <motion.div key={id ?? `empty-${i}`} layout className={`relative grid size-20 place-items-center rounded-full ${p ? `bg-gradient-to-br ${p.hue} shadow-card` : "border-2 border-dashed border-blush-300"}`}>
                  {p ? (
                    <>
                      <ProductVisual product={p} className="absolute inset-[12%] h-[76%] w-[76%]" />
                      <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className="absolute -top-1 -end-1 grid size-6 place-items-center rounded-full bg-surface text-muted shadow-card hover:text-bad">
                        <X className="size-3.5" />
                      </button>
                    </>
                  ) : (
                    <Plus className="size-5 text-blush-300" />
                  )}
                </motion.div>
              );
            })}
          </div>
          {usingSample && <p className="mt-3 text-center text-[11px] text-muted">Showing a sample face, since your own scan photo isn&apos;t on this device.</p>}
        </section>

        {/* Results */}
        <section className="space-y-4">
          <AnimatePresence mode="wait">
            {mix && v ? (
              <motion.div key={simKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ ease: EASE }} className="space-y-4">
                <div className={`flex items-center gap-4 rounded-[2rem] bg-gradient-to-r p-5 text-white ${v.cls}`}>
                  <v.icon className="size-8" />
                  <div className="flex-1">
                    <p className="font-display text-2xl">{v.label}</p>
                    <p className="text-xs opacity-90">
                      {Math.abs(mix.net)} points {mix.net >= 0 ? "better" : "worse"} across your skin
                    </p>
                  </div>
                  {tried && tried.n >= 3 && mix.verdict !== "clash" && (
                    <p className="text-end text-xs">
                      <Users className="ms-auto size-4" />
                      <span className="font-display text-lg">{tried.improvedPct}%</span>
                      <span className="block opacity-90">of {tried.n} twins who used these</span>
                    </p>
                  )}
                </div>

                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CONCERN_KEYS.map((k) => (
                    <ConcernTile key={k} k={k} now={latest.scores[k]} d={mix.delta[k]} />
                  ))}
                </ul>

                {(mix.conflicts.length > 0 || mix.risks.length > 0) && (
                  <div className="space-y-2">
                    {mix.conflicts.map((c, i) => (
                      <p key={i} className={`flex gap-2 rounded-2xl p-3 text-xs ${c.level === "avoid" ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"}`}>
                        <AlertTriangle className="size-4 shrink-0" /> <span><b className="font-medium">{productById(c.products[0])?.name} + {productById(c.products[1])?.name}.</b> {c.fix}</span>
                      </p>
                    ))}
                    {mix.risks.map((r) => (
                      <p key={r} className="flex gap-2 rounded-2xl bg-warn-soft p-3 text-xs text-warn">
                        <AlertTriangle className="size-4 shrink-0" /> {r}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button onClick={addCombo} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-plum-deep py-3.5 text-sm font-medium text-white shadow-soft hover:bg-plum">
                    <Check className="size-4" /> Add combo to my plan
                  </button>
                  <button
                    onClick={youcamPreview}
                    disabled={sim?.key === simKey && (sim.busy || Boolean(sim.image))}
                    className="flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3.5 text-sm text-plum disabled:opacity-60"
                  >
                    {sim?.key === simKey && sim.busy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                    {liveScans ? "Real preview with YouCam" : "YouCam preview"}
                  </button>
                </div>
                <p className="text-[11px] text-muted">
                  {liveScans
                    ? "Real preview uses YouCam Skin Simulation (4 units, cached per photo and combo)."
                    : sim?.key === simKey && !sim.busy && !sim.image
                      ? "Demo mode is on, so the face shows the app's own preview. Turn on YouCam live in Settings for a real render."
                      : "The face shows the app's preview. YouCam live renders a realistic one."}
                  {sim?.key === simKey && sim.note ? ` ${sim.note}` : ""}
                </p>
              </motion.div>
            ) : (
              <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2rem] border border-dashed border-blush-300 p-8 text-center text-sm text-muted">
                Add up to {MAX} products to see how they work together on your skin.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Tray */}
          <div>
            <p className="text-xs font-medium">Products</p>
            <ul className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {PRODUCTS.filter((p) => p.category !== "makeup").map((p) => {
                const on = ids.includes(p.id);
                return (
                  <li key={p.id} className="relative">
                    <motion.button
                      drag
                      dragSnapToOrigin
                      dragElastic={1}
                      whileDrag={{ scale: 1.15, zIndex: 50 }}
                      onDrag={(_, info) => setOver(inFace(info))}
                      onDragEnd={(_, info) => {
                        setOver(false);
                        if (inFace(info)) add(p.id);
                      }}
                      onTap={() => (on ? remove(p.id) : add(p.id))}
                      aria-pressed={on}
                      aria-label={`${on ? "Remove" : "Add"} ${p.name}`}
                      className={`relative block aspect-square w-full touch-none rounded-2xl bg-gradient-to-br ${p.hue} ${on ? "ring-2 ring-plum" : ""}`}
                    >
                      <ProductVisual product={p} className="pointer-events-none absolute inset-[10%] h-[80%] w-[80%]" />
                      {on && <span className="absolute top-1 end-1 grid size-5 place-items-center rounded-full bg-plum text-white"><Check className="size-3" /></span>}
                    </motion.button>
                    <p className="mt-1 line-clamp-1 text-center text-[10px] text-muted">{p.name}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
      <p className="mt-6 text-[11px] text-muted">Predicted from the demo outcome model and your measured scores. A preview, not a promise or medical advice.</p>
    </Page>
  );
}

// The app's own preview: brighter, calmer, smoother where the mix helps.
function AppPreview({ photo, delta }: { photo: string; delta: Scores }) {
  const glow = Math.max(-6, delta.radiance);
  const calm = delta.redness;
  const smooth = Math.max(0, (delta.texture + delta.pore + delta.acne) / 3);
  const filter = `brightness(${1 + glow * 0.008}) saturate(${1 - calm * 0.012}) contrast(${1 - smooth * 0.006})`;
  const mask = "radial-gradient(ellipse 34% 40% at 50% 50%, black 60%, transparent 100%)";
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="Predicted after" className="absolute inset-0 h-full w-full object-cover" style={{ filter }} draggable={false} />
      {smooth > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" style={{ filter: `${filter} blur(2px)`, opacity: Math.min(0.55, smooth * 0.07), WebkitMaskImage: mask, maskImage: mask }} draggable={false} />
      )}
      {calm < -1 && (
        <div className="absolute inset-0 mix-blend-multiply" style={{ background: "radial-gradient(ellipse 18% 12% at 32% 60%, #e05a6a, transparent), radial-gradient(ellipse 18% 12% at 68% 60%, #e05a6a, transparent)", opacity: Math.min(0.5, -calm * 0.05) }} />
      )}
    </>
  );
}

function Markers({ delta }: { delta: Scores }) {
  const shown = (Object.entries(delta) as [ConcernKey, number][]).filter(([, d]) => Math.abs(d) >= 1.5).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4);
  return (
    <>
      {shown.map(([k, d], i) => {
        const z = ZONES[k];
        return (
          <motion.span
            key={k}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.12 }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${z.x}%`, top: `${z.y}%` }}
          >
            <span className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium text-white shadow-card ${d > 0 ? "bg-good/90" : "bg-bad/90"}`}>
              <TrendMark up={d > 0} tone="bare" />
              {Math.abs(Math.round(d))} {CONCERNS[k].label}
            </span>
          </motion.span>
        );
      })}
    </>
  );
}

function ConcernTile({ k, now, d }: { k: ConcernKey; now: number; d: number }) {
  const after = Math.max(0, Math.min(100, Math.round(now + d)));
  const tone = d >= 1 ? "text-good" : d <= -1 ? "text-bad" : "text-muted";
  return (
    <li className="rounded-2xl border border-line bg-surface p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted">{CONCERNS[k].label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-xl text-ink">{after}</span>
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
          {Math.round(d) !== 0 && <TrendMark up={d > 0} />} {Math.abs(Math.round(d))}
        </span>
      </p>
      <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-blush-100">
        <div className="absolute inset-y-0 start-0 rounded-full bg-blush-300" style={{ width: `${now}%` }} />
        <motion.div
          className={`absolute inset-y-0 rounded-full ${d >= 0 ? "bg-good" : "bg-bad"}`}
          initial={{ width: 0 }}
          animate={{ left: `${Math.min(now, after)}%`, width: `${Math.abs(after - now)}%` }}
          transition={{ duration: 0.6, ease: EASE }}
        />
      </div>
    </li>
  );
}

export default function MixPage() {
  return (
    <Suspense>
      <MixLab />
    </Suspense>
  );
}
