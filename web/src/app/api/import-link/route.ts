import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";

// Reads product names from a shared cart, wishlist or product link.
// Only public https pages; private and local addresses are refused.
const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 7000;

function privateAddress(ip: string) {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:") || v === "::";
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function safeUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
  if (isIP(u.hostname) || /localhost$|\.local$|\.internal$/i.test(u.hostname)) return null;
  const addrs = await lookup(u.hostname, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some((a) => privateAddress(a.address))) return null;
  return u;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

// Product names from structured data first, then titles and headings.
function extractNames(html: string) {
  const names: string[] = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n: unknown): void => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === "object") {
          const o = n as Record<string, unknown>;
          const t = String(o["@type"] ?? "");
          if (/Product|ListItem|Offer/i.test(t) && typeof o.name === "string") names.push(o.name);
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(m[1]));
    } catch {}
  }
  for (const re of [/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/gi, /<title[^>]*>([^<]+)/gi, /<h[1-3][^>]*>([^<]{4,140})<\/h[1-3]>/gi]) {
    for (const m of html.matchAll(re)) names.push(m[1]);
  }
  // Store-style product links: /products/salicylic-acid-toner
  for (const m of html.matchAll(/\/products?\/([a-z0-9-]{6,90})/gi)) names.push(m[1].replace(/-/g, " "));
  return Array.from(new Set(names.map((n) => decode(n).trim()).filter(Boolean))).slice(0, 80);
}

async function fetchCapped(u: URL) {
  let url = u;
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "SkinTwinImport/1.0", Accept: "text/html,application/json" },
    });
    const next = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && next) {
      const safe = await safeUrl(new URL(next, url).toString());
      if (!safe) throw new Error("redirect");
      url = safe;
      continue;
    }
    if (!res.ok || !res.body) throw new Error(String(res.status));
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return { text: Buffer.concat(chunks).toString("utf8"), url };
  }
  throw new Error("redirects");
}

export async function POST(req: Request) {
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  // The link's own words often name the product already (e.g. /products/vitamin-c-serum).
  const fromPath = url ? (() => { try { return decodeURIComponent(url); } catch { return url; } })().replace(/[/?=&]+/g, "\n").replace(/[_+-]+/g, " ") : "";
  const u = url ? await safeUrl(url.trim()) : null;
  if (!u) return NextResponse.json({ error: "Paste a full https:// link to a public cart, wishlist or product page." }, { status: 400 });
  try {
    const { text, url: final } = await fetchCapped(u);
    return NextResponse.json({ host: final.hostname, names: [...extractNames(text), fromPath] });
  } catch {
    // Many carts only open in the owner's browser; fall back to the link text.
    return NextResponse.json({ host: u.hostname, names: [fromPath], partial: true });
  }
}
