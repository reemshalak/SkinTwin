// Looks captured in the try-on mirror, kept only in this browser.

export interface Look {
  id: string;
  createdAt: string;
  image: string; // jpeg data URL (YouCam render, or the app's preview)
  before: string;
  source: "youcam" | "preview";
  products: { id: string; shade: string; hex: string }[];
}

const KEY = "skintwin:looks";
const MAX = 12;

export function loadLooks(): Look[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Look[];
  } catch {
    return [];
  }
}

// Shrinks a data URL so a dozen looks fit in browser storage.
export async function shrink(src: string, max = 560): Promise<string> {
  if (!src.startsWith("data:") && !src.startsWith("http")) return src;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode().catch(() => null);
  if (!img.width) return src;
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  try {
    return c.toDataURL("image/jpeg", 0.82);
  } catch {
    return src; // a cross-origin render can't be re-encoded; keep its URL
  }
}

export function saveLook(look: Look): boolean {
  const all = [look, ...loadLooks()].slice(0, MAX);
  for (let n = all.length; n > 0; n--) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all.slice(0, n)));
      return true;
    } catch {
      // storage full: drop the oldest and retry
    }
  }
  return false;
}

export function deleteLook(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadLooks().filter((l) => l.id !== id)));
  } catch {}
}
