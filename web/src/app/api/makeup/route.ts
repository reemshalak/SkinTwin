import { NextResponse } from "next/server";
import { makeupTryOn, PhotoError } from "@/lib/youcam";

// YouCam Makeup Virtual Try-On for the AR mirror's "Capture". The browser only
// sends shades and strengths; the effect payload is built here. Opt-in per
// request (live: true) and only when the server allows live calls.
const DAILY_CAP = Number(process.env.YOUCAM_DAILY_MAKEUP ?? 20);
const PER_IP_PER_HOUR = 6;
const day = { date: "", count: 0 };
const perIp = new Map<string, number[]>();
const HEX = /^#[0-9a-f]{6}$/i;

type Pick = { hex: string; strength: number } | null | undefined;

function effects(foundation: Pick, lip: Pick) {
  const pct = (n: number) => Math.round(Math.min(1, Math.max(0.1, n)) * 100);
  const out: unknown[] = [];
  if (foundation && HEX.test(foundation.hex)) {
    out.push({ category: "foundation", palettes: [{ color: foundation.hex, colorIntensity: pct(foundation.strength), coverageIntensity: pct(foundation.strength * 0.8), glowIntensity: 30 }] });
  }
  if (lip && HEX.test(lip.hex)) {
    out.push({ category: "lip_color", shape: { name: "original" }, style: { type: "full" }, palettes: [{ color: lip.hex, texture: "satin", colorIntensity: pct(lip.strength) }] });
  }
  return out;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { imageDataUrl?: string; foundation?: Pick; lip?: Pick; live?: boolean };
  const live = body.live === true && process.env.SKIN_MODE === "live" && Boolean(process.env.YOUCAM_API_KEY);
  if (!live) return NextResponse.json({ demo: true });

  const fx = effects(body.foundation, body.lip);
  if (!fx.length) return NextResponse.json({ demo: true, note: "Pick a foundation or lip shade first." });
  const m = body.imageDataUrl ? /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(body.imageDataUrl) : null;
  if (!m) return NextResponse.json({ demo: true, note: "No photo to render on." });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const today = new Date().toISOString().slice(0, 10);
  if (day.date !== today) Object.assign(day, { date: today, count: 0 });
  const recent = (perIp.get(ip) ?? []).filter((t) => t > Date.now() - 3_600_000);
  if (day.count >= DAILY_CAP || recent.length >= PER_IP_PER_HOUR) return NextResponse.json({ demo: true, note: "Live renders are paused for now." });

  try {
    const { image, cached } = await makeupTryOn(Buffer.from(m[2], "base64"), m[1], fx);
    if (!cached) {
      day.count += 1;
      perIp.set(ip, [...recent, Date.now()]);
    }
    return NextResponse.json({ image, cached });
  } catch (e) {
    if (e instanceof PhotoError) return NextResponse.json({ demo: true, note: e.message });
    console.error("[makeup]", e);
    return NextResponse.json({ demo: true, note: "YouCam render was unavailable, so this is the app's preview." });
  }
}
