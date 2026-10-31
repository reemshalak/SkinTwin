"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { chime } from "@/lib/sound";

// Fire from anywhere: celebrate("Great job", "All 6 glasses today", "💧")
export function celebrate(title: string, sub?: string, emoji = "✨") {
  window.dispatchEvent(new CustomEvent("skintwin:celebrate", { detail: { title, sub, emoji } }));
}

// Once per day per key, so wins don't repeat on every visit.
export function celebrateOnce(key: string, title: string, sub?: string, emoji?: string) {
  try {
    const k = `skintwin:celebrated:${new Date().toISOString().slice(0, 10)}:${key}`;
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, "1");
  } catch {}
  celebrate(title, sub, emoji);
}

const COLORS = ["#E58FB0", "#8A3F66", "#F4C6D6", "#C9A0DC", "#FFD7A8", "#ffffff"];

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        x: (Math.random() - 0.5) * 900,
        y: -300 - Math.random() * 300,
        r: Math.random() * 720 - 360,
        c: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        round: i % 3 === 0,
        d: Math.random() * 0.2,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed top-1/2 left-1/2">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ width: b.w, height: b.round ? b.w : b.w * 0.45, background: b.c, borderRadius: b.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 700], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: 2.4, delay: b.d, ease: [0.2, 0.7, 0.4, 1], times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}

// Listens for celebrations and shows confetti with a small card.
export function Celebrations() {
  const [win, setWin] = useState<{ id: number; title: string; sub?: string; emoji: string } | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ title: string; sub?: string; emoji: string }>).detail;
      setWin({ id: Date.now(), ...d });
      chime();
    };
    window.addEventListener("skintwin:celebrate", on);
    return () => window.removeEventListener("skintwin:celebrate", on);
  }, []);
  useEffect(() => {
    if (!win) return;
    const t = setTimeout(() => setWin(null), 3800);
    return () => clearTimeout(t);
  }, [win]);
  return (
    <AnimatePresence>
      {win && (
        <div key={win.id} className="pointer-events-none fixed inset-0 z-[60] grid place-items-center">
          <Confetti />
          <motion.button
            onClick={() => setWin(null)}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="pointer-events-auto rounded-[2rem] border border-rose/30 bg-surface px-8 py-6 text-center shadow-soft"
          >
            <motion.span className="block text-5xl" animate={{ rotate: [0, -12, 12, -6, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.8 }}>{win.emoji}</motion.span>
            <span className="mt-2 block font-display text-3xl text-ink">{win.title}</span>
            {win.sub && <span className="mt-1 block text-sm text-muted">{win.sub}</span>}
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}

// Drop into JSX: celebrates (once a day) the moment `when` turns true.
export function CelebrateWhen({ when, id, title, sub, emoji }: { when: boolean; id: string; title: string; sub?: string; emoji?: string }) {
  useEffect(() => {
    if (when) celebrateOnce(id, title, sub, emoji);
  }, [when, id, title, sub, emoji]);
  return null;
}
