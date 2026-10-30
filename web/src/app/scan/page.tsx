"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Droplet, ImageUp, RefreshCw, Scissors, ShieldCheck, Smile, Sun } from "lucide-react";
import { FaceAvatar } from "@/components/FaceAvatar";
import { Page, PageTitle } from "@/components/Page";
import { downscale } from "@/lib/image";
import { hashString } from "@/lib/random";
import { SCANNABLE_FACES, sampleById } from "@/lib/samples";
import { useStore } from "@/lib/store";

type Light = "dark" | "ok" | "bright" | "unknown";
const LIGHT_TEXT: Record<Light, string> = {
  unknown: "Checking light…",
  dark: "Too dark. Face a window or lamp",
  ok: "Good light. Hold still",
  bright: "Too bright. Step out of direct light",
};

export default function ScanPage() {
  const router = useRouter();
  const { setPending, latest, scans } = useStore();
  const checkIn = scans.length > 0;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState<"off" | "starting" | "on" | "denied">("off");
  const [light, setLight] = useState<Light>("unknown");
  const [level, setLevel] = useState<number | null>(null); // live brightness 0-255
  const [lastLevel, setLastLevel] = useState<number | null>(null); // last check-in's brightness
  const [ghost, setGhost] = useState(true);
  const lastPhoto = checkIn ? latest?.photo : undefined;
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setError(null);
    setCamera("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamera("on");
    } catch {
      setCamera("denied");
    }
  }

  // Light check: average brightness of a tiny frame, twice a second.
  useEffect(() => {
    if (camera !== "on") return;
    if (videoRef.current) videoRef.current.srcObject = streamRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || !ctx || v.readyState < 2) return;
      ctx.drawImage(v, 0, 0, 32, 32);
      const d = ctx.getImageData(0, 0, 32, 32).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      const avg = sum / (d.length / 4);
      setLevel(avg);
      setLight(avg < 70 ? "dark" : avg > 205 ? "bright" : "ok");
    }, 500);
    return () => clearInterval(id);
  }, [camera]);

  // Brightness of last week's photo, so this week's light can match it.
  useEffect(() => {
    if (!lastPhoto) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 32;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 32, 32);
      const d = ctx.getImageData(0, 0, 32, 32).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      setLastLevel(sum / (d.length / 4));
    };
    img.src = lastPhoto;
  }, [lastPhoto]);

  const lightMatch =
    level === null || lastLevel === null ? null : Math.abs(level - lastLevel) <= 22 ? "Same light as last week" : level < lastLevel ? "Darker than last week" : "Brighter than last week";

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // keep the mirrored selfie orientation
    ctx.drawImage(v, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();
    setCamera("off");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError("That photo is over 10 MB. Try a smaller one.");
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  const [repeat, setRepeat] = useState<{ sampleId?: string; imageDataUrl?: string } | null>(null);

  // Hand the photo to the full-screen analysis view, which runs the scan.
  async function analyze(body: { sampleId?: string; imageDataUrl?: string }, force = false) {
    const photoHash = body.imageDataUrl ? `img:${hashString(body.imageDataUrl.slice(0, 40000))}` : `sample:${body.sampleId}`;
    // Same photo as the last check-in would just duplicate the journal entry.
    if (!force && latest?.photoHash === photoHash) return setRepeat(body);
    setRepeat(null);
    setBusy(true);
    const photo = body.imageDataUrl ? await downscale(body.imageDataUrl) : sampleById(body.sampleId!)!.image;
    setPending({ ...body, photo, photoHash });
    router.push("/analysis");
  }


  return (
    <Page>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
      <div className="mx-auto w-full max-w-md lg:order-2 lg:mx-0">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-gradient-to-b from-blush-100 to-blush-200">
          {camera === "on" && !preview && (
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
          )}
          {/* Last check-in as a faint ghost, so this week's photo lines up */}
          {camera === "on" && !preview && lastPhoto && ghost && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lastPhoto} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen" />
          )}
          {camera !== "on" && !preview && (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-blush-100 via-blush-200 to-blush-300">
              <span className="absolute size-56 animate-ping rounded-full bg-white/25 [animation-duration:2.4s]" aria-hidden />
              <button
                type="button"
                onClick={startCamera}
                disabled={camera === "starting"}
                className="relative z-10 flex flex-col items-center gap-3 rounded-[2rem] bg-surface px-7 py-6 text-ink shadow-soft transition hover:scale-105 disabled:opacity-70"
              >
                <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-rose to-plum text-white shadow-soft">
                  <Camera className="size-7" />
                </span>
                <span className="text-sm font-medium">{camera === "starting" ? "Starting camera…" : "Tap to turn on camera"}</span>
                <span className="text-[11px] text-muted">Your preview appears here</span>
              </button>
            </div>
          )}
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your photo" className="absolute inset-0 h-full w-full object-cover" />
          )}

          {/* Face guide: corners + dotted mesh, like the reference scan UI */}
          <svg viewBox="0 0 300 400" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <path d="M40 70 V40 H70 M230 40 H260 V70 M260 330 V360 H230 M70 360 H40 V330" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            <ellipse cx="150" cy="190" rx="88" ry="118" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="2 6" opacity="0.8" />
            {[[150, 110], [112, 160], [188, 160], [150, 195], [125, 245], [175, 245], [150, 280], [95, 205], [205, 205]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.6" fill="white" className={busy ? "animate-dot" : ""} style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </svg>
          {busy && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
              <div className="animate-scanline h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
            </div>
          )}

          <div className="absolute inset-x-4 top-4 flex flex-col items-center gap-1.5">
            <span className="rounded-full bg-plum/75 px-3 py-1 text-[11px] text-white backdrop-blur">
              {busy ? "Analysing 8 skin concerns…" : camera === "on" ? LIGHT_TEXT[light] : preview ? "Looks good" : "Face the camera, hair off forehead"}
            </span>
            {camera === "on" && !preview && lightMatch && light === "ok" && (
              <span className={`rounded-full px-3 py-1 text-[11px] text-white backdrop-blur ${lightMatch.startsWith("Same") ? "bg-good/80" : "bg-warn/80"}`}>{lightMatch}</span>
            )}
          </div>
          {camera === "on" && !preview && lastPhoto && (
            <button onClick={() => setGhost((g) => !g)} className="absolute right-4 bottom-24 rounded-full bg-black/35 px-3 py-1.5 text-[11px] text-white backdrop-blur">
              {ghost ? "Hide" : "Show"} last week&apos;s outline
            </button>
          )}
        </div>

        <div className="glass relative -mt-20 mx-3 flex items-center justify-between rounded-[1.75rem] bg-surface/60 px-5 py-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Upload a photo"
            className="flex flex-col items-center gap-1 text-[10px] font-medium text-plum-deep disabled:opacity-50"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-surface/90 text-plum shadow-card transition hover:scale-105"><ImageUp className="size-5" /></span>
            Upload
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onFile} />

          {preview ? (
            <button
              type="button"
              onClick={() => analyze({ imageDataUrl: preview })}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-rose to-plum px-7 py-3.5 text-sm font-medium text-white shadow-soft disabled:opacity-70"
            >
              {busy ? "Analysing…" : "Analyse my skin"}
            </button>
          ) : (
            <button
              type="button"
              onClick={camera === "on" ? capture : startCamera}
              disabled={busy || camera === "starting" || (camera === "on" && light !== "ok")}
              aria-label={camera === "on" ? "Take photo" : "Turn on camera"}
              className="flex flex-col items-center gap-1 text-[10px] font-medium text-plum-deep disabled:opacity-50"
            >
              <span className="grid size-[4.5rem] place-items-center rounded-full bg-[radial-gradient(circle,#ffffff_0%,#f0c9d9_35%,#e37ea5_70%,#d05b85_100%)] shadow-soft ring-4 ring-white/70 transition hover:scale-105">
                <Camera className="size-6 text-white" />
              </span>
              {camera === "on" ? (light === "ok" ? "Take photo" : "Waiting for light") : "Camera"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setError(null);
              if (camera !== "on") startCamera();
            }}
            disabled={busy}
            aria-label="Retake"
            className="flex flex-col items-center gap-1 text-[10px] font-medium text-plum-deep disabled:opacity-50"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-surface/90 text-plum shadow-card transition hover:scale-105"><RefreshCw className="size-5" /></span>
            Retake
          </button>
        </div>
        {camera === "denied" && (
          <p className="mt-3 text-center text-xs text-bad">Camera access was blocked. Upload a photo or try the sample face instead.</p>
        )}
        {error && <p className="mt-3 text-center text-xs text-bad">{error}</p>}
        {repeat && (
          <div className="mt-3 rounded-2xl bg-warn-soft p-4 text-center text-xs text-warn">
            <p className="font-medium">This is the same photo as your last check-in.</p>
            <p className="mt-1 opacity-90">Take a new photo to see real progress.</p>
            <button onClick={() => analyze(repeat, true)} className="mt-2 underline">Scan it anyway</button>
          </div>
        )}
      </div>

      <section className="lg:order-1 lg:pt-4">
        <PageTitle
          eyebrow={checkIn ? "Weekly check-in" : "Your skin scan"}
          title={checkIn ? "How's your skin this week?" : "Let's measure your skin"}
          mark="skin"
          subtitle={
            checkIn
              ? "Line your face up with last week's ghost and match the light, so the change you see is your skin, not the photo."
              : "One clear selfie is all it takes. YouCam AI scores 8 concerns so we can find people whose skin measures like yours."
          }
        />
        <div className="grid gap-3">
          <button
            type="button"
            onClick={startCamera}
            disabled={busy || camera === "starting" || camera === "on"}
            className="group flex items-center gap-4 rounded-[1.75rem] bg-gradient-to-r from-rose to-plum p-4 text-left text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20"><Camera className="size-6" /></span>
            <span className="flex-1">
              <span className="block text-base font-medium">{camera === "on" ? "Camera is on" : "Use my camera"}</span>
              <span className="text-xs text-white/85">Best results · we check your light · 10 seconds</span>
            </span>
            <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="group flex items-center gap-4 rounded-[1.75rem] border border-line bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-plum hover:shadow-soft disabled:opacity-60"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blush-100 text-plum"><ImageUp className="size-6" /></span>
            <span className="flex-1">
              <span className="block text-base font-medium">Upload a photo</span>
              <span className="text-xs text-muted">A clear, front-facing selfie (JPG or PNG)</span>
            </span>
            <ArrowRight className="size-5 text-plum transition group-hover:translate-x-1" />
          </button>
          {SCANNABLE_FACES.map((f) => (
            <button
              id="samples"
              key={f.id}
              type="button"
              disabled={busy}
              onClick={() => analyze({ sampleId: f.id })}
              className="group flex scroll-mt-24 items-center gap-4 rounded-[1.75rem] border border-line bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-plum hover:shadow-soft disabled:opacity-60"
            >
              <FaceAvatar src={f.image} tone={f.tone} alt={`Sample face: ${f.name}`} className="size-14 shrink-0 rounded-2xl" />
              <span className="flex-1">
                <span className="block text-base font-medium">Try a sample face</span>
                <span className="text-xs text-muted">No camera? Scan {f.name} ({f.note.toLowerCase()}) instead</span>
              </span>
              <ArrowRight className="size-5 text-plum transition group-hover:translate-x-1" />
            </button>
          ))}
        </div>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">For the best scan</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {TIPS.map(({ icon: Icon, title }) => (
            <li key={title} className="flex items-center gap-1.5 rounded-full bg-blush-100/70 px-3 py-1.5 text-[11px] text-ink">
              <Icon className="size-3.5 text-plum" /> {title}
            </li>
          ))}
        </ul>
        <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-good" />
          Your photo is sent only for analysis and is never stored or shown to anyone. Results are cosmetic guidance, not a
          medical diagnosis.
        </p>
      </section>
      </div>
    </Page>
  );
}

const TIPS = [
  { icon: Sun, title: "Face soft light", text: "A window or lamp in front of you. We check the light for you." },
  { icon: Smile, title: "Neutral face", text: "Eyes open, mouth closed, look straight at the camera." },
  { icon: Scissors, title: "Hair off your forehead", text: "Tie it back so the whole face is visible." },
  { icon: Droplet, title: "Bare skin is best", text: "No makeup or filters, so we measure your real skin." },
];
