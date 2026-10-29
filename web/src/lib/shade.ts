import { personById } from "./people";
import type { Twin } from "./twins";

// Skin-tone shade matching, done on the device: average the cheek pixels of
// your scan photo and pick the closest shade in perceptual (Lab) colour space.

type RGB = [number, number, number];
const hexToRgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
export const rgbToHex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function lab([r, g, b]: RGB) {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047);
  const y = f(R * 0.2126 + G * 0.7152 + B * 0.0722);
  const z = f((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dist = (a: RGB, b: RGB) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

export function closestShade<T extends { hex: string }>(rgb: RGB, shades: T[]) {
  return shades.reduce((best, s) => (dist(rgb, hexToRgb(s.hex)) < dist(rgb, hexToRgb(best.hex)) ? s : best));
}

// Average colour of both cheeks in a front-facing 4:5 portrait.
export async function skinColorOf(src: string): Promise<RGB | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  try {
    await img.decode();
  } catch {
    return null;
  }
  const c = document.createElement("canvas");
  c.width = 80;
  c.height = 100;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, 80, 100);
  let n = 0;
  const sum: RGB = [0, 0, 0];
  for (const [x0, y0] of [[20, 56], [52, 56]]) {
    const d = ctx.getImageData(x0, y0, 8, 8).data;
    for (let i = 0; i < d.length; i += 4) {
      sum[0] += d[i];
      sum[1] += d[i + 1];
      sum[2] += d[i + 2];
      n++;
    }
  }
  return n ? (sum.map((v) => v / n) as RGB) : null;
}

// Which shades your closest twins would wear, from their skin tone.
export function twinShadePicks<T extends { name: string; hex: string }>(featured: Twin[], shades: T[]) {
  const counts = new Map<string, number>();
  for (const t of featured) {
    const tone = personById(t.member.personId!)?.tone;
    if (!tone) continue;
    const s = closestShade(hexToRgb(tone), shades);
    counts.set(s.name, (counts.get(s.name) ?? 0) + 1);
  }
  return shades.map((s) => ({ shade: s, n: counts.get(s.name) ?? 0 }));
}
