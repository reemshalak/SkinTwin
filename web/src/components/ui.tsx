import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import { CountUp, GrowBar, MotionCircle } from "./motion";
import { ProductVisual } from "./ProductArt";
import type { Confidence } from "@/lib/twins";
import type { Product } from "@/lib/types";

export function ScoreRing({ value, size = 148, label = "/100" }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.3)" strokeWidth="8" />
        <MotionCircle cx={size / 2} cy={size / 2} r={r} c={c} value={value} />
      </svg>
      <div className="absolute text-center text-white">
        <CountUp value={value} className="font-display text-5xl font-light" />
        <span className="text-sm opacity-80">{label}</span>
      </div>
    </div>
  );
}

export function Bar({ value, tone = "plum" }: { value: number; tone?: "plum" | "white" }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${tone === "white" ? "bg-white/35" : "bg-blush-100"}`}>
      <GrowBar value={value} className={`h-full rounded-full ${tone === "white" ? "bg-surface" : "bg-gradient-to-r from-blush-400 to-plum"}`} />
    </div>
  );
}

const CONF: Record<Confidence, { text: string; cls: string }> = {
  none: { text: "Not enough data", cls: "bg-blush-100 text-muted" },
  low: { text: "Low confidence", cls: "bg-warn-soft text-warn" },
  medium: { text: "Medium confidence", cls: "bg-plum-soft text-plum" },
  high: { text: "High confidence", cls: "bg-good-soft text-good" },
};

export function ConfidenceBadge({ level, n }: { level: Confidence; n: number }) {
  const c = CONF[level];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${c.cls}`}>
      {c.text}
      <span className="opacity-70">· {n}</span>
    </span>
  );
}

export function PageHeader({ title, back, right }: { title: string; back?: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-3">
      {back ? (
        <Link href={back} aria-label="Back" className="grid size-10 place-items-center rounded-full bg-surface shadow-card">
          <ChevronLeft className="size-5 text-ink" />
        </Link>
      ) : (
        <span className="size-10" />
      )}
      <h1 className="rounded-full bg-surface px-5 py-2 text-sm font-medium shadow-card">{title}</h1>
      {right ?? <span className="size-10" />}
    </header>
  );
}

export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-blush-100 px-3 py-2 text-[11px] leading-relaxed text-muted">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function ProductThumb({ product, size = "md" }: { product: Product; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "size-12 rounded-xl", md: "size-16 rounded-2xl", lg: "h-56 w-full rounded-[2rem]" }[size];
  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br ${product.hue} ${dims}`} aria-hidden>
      <ProductVisual product={product} className="absolute inset-[8%] h-[84%] w-[84%]" />
    </div>
  );
}

export function Delta({ value }: { value: number }) {
  const cls = value >= 1 ? "text-good" : value <= -1 ? "text-bad" : "text-muted";
  return (
    <span className={`tabular-nums font-medium ${cls}`}>
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} out of 5`} className="tracking-tight text-rose">
      {"★★★★★".slice(0, Math.round(value))}
      <span className="text-blush-200">{"★★★★★".slice(Math.round(value))}</span>
    </span>
  );
}
