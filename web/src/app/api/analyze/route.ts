import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { hashString } from "@/lib/random";
import { mockScoresFor, mockYouCamResponse, profileFromYouCam } from "@/lib/skin-analysis";
import { sampleById } from "@/lib/samples";
import { analyzeSkin, PhotoError } from "@/lib/youcam";

// SKIN_MODE=live allows YouCam Skin Analysis; each request opts in with live: true.
// Otherwise (or on any failure) demo scores in the same response format are used.
const DAILY_CAP = Number(process.env.YOUCAM_DAILY_SCANS ?? 25);
const PER_IP_PER_HOUR = 4;
const day = { date: "", count: 0 };
const perIp = new Map<string, number[]>();

function allowLive(ip: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (day.date !== today) Object.assign(day, { date: today, count: 0 });
  if (day.count >= DAILY_CAP) return "Live scans are paused for today, so this is a demo result.";
  const hour = Date.now() - 3_600_000;
  const recent = (perIp.get(ip) ?? []).filter((t) => t > hour);
  if (recent.length >= PER_IP_PER_HOUR) return "You've done a lot of scans this hour, so this is a demo result.";
  return null;
}

function decodeDataUrl(dataUrl: string) {
  const m = /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(dataUrl);
  return m ? { contentType: m[1], bytes: Buffer.from(m[2], "base64") } : null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { sampleId?: string; imageDataUrl?: string; live?: boolean };
  // Live needs the server to allow it and the user to switch it on for this scan.
  const live = body.live === true && process.env.SKIN_MODE === "live" && Boolean(process.env.YOUCAM_API_KEY);
  const fallback = (note?: string) => {
    const fingerprint = body.imageDataUrl ? String(hashString(body.imageDataUrl.slice(0, 20000))) : undefined;
    const profile = profileFromYouCam(mockYouCamResponse(mockScoresFor({ sampleId: body.sampleId, fingerprint })), {
      source: live ? "fallback" : "mock",
      sampleId: body.sampleId,
    });
    return NextResponse.json({ profile, note });
  };

  if (!live) return fallback();

  // Photo bytes: an uploaded selfie, or a sample face from /public.
  let image: { bytes: Buffer; contentType: string } | null = null;
  if (body.imageDataUrl) image = decodeDataUrl(body.imageDataUrl);
  else if (body.sampleId && sampleById(body.sampleId)) {
    try {
      const file = path.join(process.cwd(), "public", sampleById(body.sampleId)!.image);
      image = { bytes: await readFile(file), contentType: "image/jpeg" };
    } catch {
      image = null; // sample photo not generated yet
    }
  }
  if (!image) return fallback();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const blocked = allowLive(ip);
  if (blocked) return fallback(blocked);

  try {
    const { res, cached } = await analyzeSkin(image.bytes, image.contentType);
    if (!cached) {
      day.count += 1;
      perIp.set(ip, [...(perIp.get(ip) ?? []), Date.now()]);
    }
    const profile = profileFromYouCam(res, { source: "live", sampleId: body.sampleId });
    return NextResponse.json({ profile, cached });
  } catch (e) {
    if (e instanceof PhotoError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("[analyze]", e);
    return fallback("Live analysis was unavailable, so these are demo scores.");
  }
}
