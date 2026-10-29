import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { sampleById } from "@/lib/samples";
import { PhotoError, simulateSkin } from "@/lib/youcam";

// YouCam Skin Simulation for Mix Lab. Opt-in per request (live: true) and only
// when the server allows live calls; otherwise the app shows its own preview.
const DAILY_CAP = Number(process.env.YOUCAM_DAILY_SIMS ?? 15);
const PER_IP_PER_HOUR = 4;
const day = { date: "", count: 0 };
const perIp = new Map<string, number[]>();
const KEYS = new Set(["wrinkle", "radiance", "acne", "pores", "texture", "redness", "spots", "eye_bags", "dark_circle"]);

function blockedReason(ip: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (day.date !== today) Object.assign(day, { date: today, count: 0 });
  if (day.count >= DAILY_CAP) return "Live previews are paused for today.";
  const recent = (perIp.get(ip) ?? []).filter((t) => t > Date.now() - 3_600_000);
  if (recent.length >= PER_IP_PER_HOUR) return "That's a lot of previews this hour. Try again later.";
  return null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { sampleId?: string; imageDataUrl?: string; intensities?: Record<string, number>; live?: boolean };
  const live = body.live === true && process.env.SKIN_MODE === "live" && Boolean(process.env.YOUCAM_API_KEY);
  if (!live) return NextResponse.json({ demo: true });

  const intensities = Object.fromEntries(
    Object.entries(body.intensities ?? {})
      .filter(([k, v]) => KEYS.has(k) && typeof v === "number" && v > 0)
      .map(([k, v]) => [k, Math.round(Math.min(1, v) * 10) / 10]),
  );
  if (!Object.keys(intensities).length) return NextResponse.json({ demo: true, note: "This mix doesn't visibly change skin, so there's nothing to preview." });

  let image: { bytes: Buffer; contentType: string } | null = null;
  const m = body.imageDataUrl ? /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(body.imageDataUrl) : null;
  if (m) image = { contentType: m[1], bytes: Buffer.from(m[2], "base64") };
  else if (body.sampleId && sampleById(body.sampleId)) {
    try {
      image = { contentType: "image/jpeg", bytes: await readFile(path.join(process.cwd(), "public", sampleById(body.sampleId)!.image)) };
    } catch {}
  }
  if (!image) return NextResponse.json({ demo: true, note: "No photo to preview on." });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const blocked = blockedReason(ip);
  if (blocked) return NextResponse.json({ demo: true, note: blocked });

  try {
    const { image: result, cached } = await simulateSkin(image.bytes, image.contentType, intensities);
    if (!cached) {
      day.count += 1;
      perIp.set(ip, [...(perIp.get(ip) ?? []), Date.now()]);
    }
    return NextResponse.json({ image: result, cached });
  } catch (e) {
    if (e instanceof PhotoError) return NextResponse.json({ demo: true, note: e.message });
    console.error("[simulate]", e);
    return NextResponse.json({ demo: true, note: "YouCam preview was unavailable, so this is the app's own preview." });
  }
}
