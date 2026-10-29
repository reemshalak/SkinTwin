import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { YouCamTaskResponse } from "./types";

// YouCam Skin Analysis (s2s v2.0), SD, 8 concerns = 12 units per successful scan.
const BASE = "https://yce-api-01.makeupar.com";
export const SD_ACTIONS = ["moisture", "oiliness", "redness", "texture", "pore", "acne", "radiance", "wrinkle"];

const CACHE_DIR = path.join(process.cwd(), ".cache", "youcam");

// Readable reasons for YouCam's photo errors.
const PHOTO_ERRORS: Record<string, string> = {
  error_below_min_image_size: "That photo is too small. Use one at least 480px on the short side.",
  error_src_face_too_small: "Move closer so your face fills most of the frame.",
  error_src_face_out_of_bound: "Keep your whole face inside the frame.",
  error_lighting_dark: "It's too dark. Face a window or a lamp.",
  error_exceed_max_image_size: "That photo is too large.",
};

export class PhotoError extends Error {}

async function api<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + url, {
    method,
    headers: { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string; error_code?: string };
  if (!res.ok) throw new Error(`YouCam ${method} ${url} failed (${res.status}): ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

export function photoKey(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 32);
}

async function readCache(key: string): Promise<YouCamTaskResponse | null> {
  try {
    return JSON.parse(await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8"));
  } catch {
    return null;
  }
}

async function writeCache(key: string, res: YouCamTaskResponse) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(res));
  } catch {}
}

// Upload a photo to YouCam; returns the file id tasks use.
async function uploadFile(bytes: Buffer, contentType: string) {
  const file = await api<{ data: { files: { file_id: string; requests: { url: string; method?: string; headers?: Record<string, string> }[] }[] } }>(
    "POST",
    "/s2s/v2.0/file",
    { files: [{ content_type: contentType, file_name: `scan.${contentType.includes("png") ? "png" : "jpg"}`, file_size: bytes.length }] },
  );
  const { file_id, requests } = file.data.files[0];
  const put = requests[0];
  const up = await fetch(put.url, { method: put.method || "PUT", headers: put.headers, body: new Uint8Array(bytes) });
  if (!up.ok) throw new Error(`YouCam upload failed (${up.status})`);
  return file_id;
}

// Upload -> create task -> poll. Cached by photo, so a repeat costs nothing.
export async function analyzeSkin(bytes: Buffer, contentType: string): Promise<{ res: YouCamTaskResponse; cached: boolean }> {
  const key = photoKey(bytes);
  const hit = await readCache(key);
  if (hit) return { res: hit, cached: true };

  const file_id = await uploadFile(bytes, contentType);

  const task = await api<{ data: { task_id: string } }>("POST", "/s2s/v2.0/task/skin-analysis", {
    src_file_id: file_id,
    dst_actions: SD_ACTIONS,
    format: "json",
  });

  const started = Date.now();
  while (Date.now() - started < 45_000) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await api<YouCamTaskResponse & { data: { error?: string; error_message?: string } }>("GET", `/s2s/v2.0/task/skin-analysis/${task.data.task_id}`);
    const status = res.data?.task_status;
    if (status === "success") {
      await writeCache(key, res);
      return { res, cached: false };
    }
    if (status === "error") {
      const code = String(res.data.error ?? res.data.error_message ?? "");
      const friendly = Object.entries(PHOTO_ERRORS).find(([k]) => code.includes(k))?.[1];
      throw friendly ? new PhotoError(friendly) : new Error(`YouCam task error: ${code}`);
    }
  }
  throw new Error("YouCam took too long to respond");
}

// YouCam Skin Simulation: a realistic preview of the same face with some concerns
// improved. Intensities are 0-1 per concern. Cached by photo + settings.
export async function simulateSkin(bytes: Buffer, contentType: string, intensities: Record<string, number>): Promise<{ image: string; cached: boolean }> {
  const key = `sim-${photoKey(bytes)}-${createHash("sha256").update(JSON.stringify(intensities)).digest("hex").slice(0, 12)}`;
  try {
    const hit = JSON.parse(await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8")) as { image: string };
    return { image: hit.image, cached: true };
  } catch {}

  const file_id = await uploadFile(bytes, contentType);
  const task = await api<{ data: { task_id: string } }>("POST", "/s2s/v2.0/task/skin-simulation", { src_file_id: file_id, ...intensities });

  const started = Date.now();
  while (Date.now() - started < 45_000) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await api<{ data: { task_status: string; results?: unknown; url?: string; error?: string } }>("GET", `/s2s/v2.0/task/skin-simulation/${task.data.task_id}`);
    if (res.data?.task_status === "success") {
      const r = res.data.results as { url?: string } | { url?: string }[] | undefined;
      const url = (Array.isArray(r) ? r[0]?.url : r?.url) ?? res.data.url;
      if (!url) throw new Error("YouCam simulation returned no image");
      // The result link expires, so keep the image itself.
      const img = await fetch(url);
      if (!img.ok) throw new Error(`YouCam result download failed (${img.status})`);
      const type = img.headers.get("content-type") ?? "image/jpeg";
      const image = `data:${type};base64,${Buffer.from(await img.arrayBuffer()).toString("base64")}`;
      try {
        await mkdir(CACHE_DIR, { recursive: true });
        await writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify({ image }));
      } catch {}
      return { image, cached: false };
    }
    if (res.data?.task_status === "error") {
      const code = String(res.data.error ?? "");
      const friendly = Object.entries(PHOTO_ERRORS).find(([k]) => code.includes(k))?.[1];
      throw friendly ? new PhotoError(friendly) : new Error(`YouCam simulation error: ${code}`);
    }
  }
  throw new Error("YouCam took too long to respond");
}
