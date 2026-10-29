"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

// Drag (or use arrow keys) to compare two images. Nudges itself once on first view
// so people notice it's interactive.
export function BeforeAfter({
  before,
  after,
  afterStyle,
  labels = ["Before", "After"],
  className = "",
}: {
  before: string;
  after: string;
  afterStyle?: React.CSSProperties;
  labels?: [string, string];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const touched = useRef(false);

  const move = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  }, []);

  useEffect(() => {
    // Gentle hint animation until the first interaction.
    let t = 0;
    const id = setInterval(() => {
      if (touched.current) return clearInterval(id);
      t += 1;
      setPos(50 + Math.sin(t / 6) * 18);
      if (t > 60) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={ref}
      className={`relative cursor-ew-resize touch-none select-none overflow-hidden ${className}`}
      onPointerDown={(e) => {
        touched.current = true;
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging && move(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={labels[1]} className="absolute inset-0 h-full w-full object-cover" style={afterStyle} draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={labels[0]} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      </div>
      <span className="absolute top-4 left-4 rounded-full bg-ink/50 px-3 py-1 text-xs text-white backdrop-blur">{labels[0]}</span>
      <span className="absolute top-4 right-4 rounded-full bg-surface/85 px-3 py-1 text-xs text-plum-deep backdrop-blur">{labels[1]}</span>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -translate-x-1/2 border-l-2 border-white/90 shadow-[0_0_12px_rgba(0,0,0,0.25)]" />
        <motion.button
          type="button"
          aria-label="Drag to compare before and after"
          className="pointer-events-auto absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface text-plum-deep shadow-soft"
          animate={dragging ? { scale: 1.12 } : { scale: 1 }}
          onKeyDown={(e) => {
            touched.current = true;
            if (e.key === "ArrowLeft") setPos((p) => Math.max(2, p - 5));
            if (e.key === "ArrowRight") setPos((p) => Math.min(98, p + 5));
          }}
        >
          <MoveHorizontal className="size-5" />
        </motion.button>
      </div>
    </div>
  );
}
