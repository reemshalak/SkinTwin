"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";

// First-time tour: dims the screen, spotlights one real button at a time and
// says what it's for. Runs once after the first scan; replay from Settings.
export const TOUR_KEY = "skintwin:tour-done";

const STEPS = [
  { id: "skin", title: "Your skin, always here", text: "Your skin map and 8 scores live in My skin, with your progress and goal." },
  { id: "twins", title: "People with your skin", text: "Your skin twins: people whose scores sit close to yours. Their results are measured by scans, not typed." },
  { id: "products", title: "What works for you", text: "Every product says how it went for twins like you. Green worked, orange was risky." },
  { id: "plan", title: "Your routine", text: "A morning and evening plan built from what worked, with strong products spaced so they never clash." },
  { id: "checkin", title: "Check in weekly", text: "One selfie a week shows what's changing, and which products are actually working." },
];

// The visible element for a step (top bar on desktop, bottom bar on phones).
function target(id: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)).find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}

export function Tour() {
  const path = usePathname();
  const { ready, latest } = useStore();
  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Start once: after a first scan, on a normal page.
  useEffect(() => {
    if (!ready || !latest || step >= 0 || ["/analysis", "/mirror", "/scan"].includes(path)) return;
    let seen = true;
    try {
      seen = localStorage.getItem(TOUR_KEY) === "1";
    } catch {}
    if (seen) return;
    // Wait until other full-screen moments (like the twin-matching intro) are gone.
    const id = setInterval(() => {
      if (!document.querySelector("[data-overlay]")) {
        clearInterval(id);
        setTimeout(() => setStep((s) => (s < 0 ? 0 : s)), 700);
      }
    }, 500);
    return () => clearInterval(id);
  }, [ready, latest, path, step]);

  const measure = useCallback(() => {
    if (step < 0 || step >= STEPS.length) return;
    const el = target(STEPS[step].id);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  function finish() {
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {}
    setStep(STEPS.length);
  }

  const active = step >= 0 && step < STEPS.length;
  const s = active ? STEPS[step] : null;
  const pad = 8;
  const below = rect ? rect.top < window.innerHeight / 2 : true;
  const tipLeft = rect ? Math.min(Math.max(16, rect.left + rect.width / 2 - 150), window.innerWidth - 316) : 16;

  return (
    <AnimatePresence>
      {active && s && (
        <motion.div key="tour" className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Quick tour">
          {/* Spotlight: a hole in the dimmed screen around the button */}
          {rect ? (
            <motion.div
              className="pointer-events-none absolute rounded-2xl ring-2 ring-white/80"
              style={{ boxShadow: "0 0 0 9999px rgba(20,10,16,0.62)" }}
              animate={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          ) : (
            <div className="absolute inset-0 bg-[rgba(20,10,16,0.62)]" />
          )}

          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: below ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute w-[300px] rounded-[1.5rem] bg-surface p-4 text-ink shadow-soft"
            style={rect ? { left: tipLeft, ...(below ? { top: rect.bottom + pad + 12 } : { bottom: window.innerHeight - rect.top + pad + 12 }) } : { left: "50%", top: "40%", transform: "translateX(-50%)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-plum">{step + 1} of {STEPS.length}</p>
            <p className="mt-1 font-display text-xl">{s.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={finish} className="text-xs text-muted hover:text-plum">Skip tour</button>
              <div className="flex items-center gap-3">
                <span className="flex gap-1" aria-hidden>
                  {STEPS.map((_, i) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-plum" : "w-1.5 bg-blush-200"}`} />
                  ))}
                </span>
                <button onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))} className="rounded-full bg-plum-deep px-4 py-2 text-xs font-medium text-white">
                  {step === STEPS.length - 1 ? "Got it" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
