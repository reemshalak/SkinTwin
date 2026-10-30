"use client";

import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { EASE } from "./motion";
import { COHORT_SIZE } from "@/lib/cohort";
import { personAvatar, personById } from "@/lib/people";
import type { Twin } from "@/lib/twins";

const SEEN = "skintwin:matched:";

// One-time "finding your twins" sequence per scan: scan the cohort, narrow to twins.
export function TwinMatcher({ scanId, twins, featured }: { scanId: string; twins: number; featured: Twin[] }) {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<"scan" | "narrow">("scan");
  const n = useMotionValue(0);
  const text = useTransform(n, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN + scanId) === "1";
    } catch {}
    if (seen) return;
    const markSeen = () => {
      try {
        sessionStorage.setItem(SEEN + scanId, "1");
      } catch {}
    };
    setShow(true);
    setPhase("scan");
    n.set(0);
    let b: ReturnType<typeof animate> | undefined;
    const a = animate(n, COHORT_SIZE, { duration: 1.1, ease: "easeOut" });
    const t1 = setTimeout(() => {
      setPhase("narrow");
      b = animate(n, twins, { duration: 0.9, ease: EASE });
    }, 1250);
    const t2 = setTimeout(() => {
      markSeen();
      setShow(false);
    }, 3000);
    return () => {
      a.stop();
      b?.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      setShow(false);
    };
  }, [scanId, twins, n]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          data-overlay="matcher"
          className="fixed inset-0 z-40 grid place-items-center bg-blush-50/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          onClick={() => {
            try {
              sessionStorage.setItem(SEEN + scanId, "1");
            } catch {}
            setShow(false);
          }}
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="relative mx-auto h-28 w-72">
              {featured.slice(0, 5).map((t, i) => {
                const p = personById(t.member.personId!)!;
                const x = (i - 2) * 52;
                return (
                  <motion.div
                    key={p.id}
                    className="absolute top-4 left-1/2"
                    initial={{ opacity: 0, scale: 0.4, x: x * 2.2 - 40, y: (i % 2 ? -1 : 1) * 40 }}
                    animate={phase === "narrow" ? { opacity: 1, scale: 1, x: x - 40, y: 0 } : { opacity: 0.35, scale: 0.6, x: x * 2.2 - 40, y: (i % 2 ? -1 : 1) * 30 }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
                  >
                    <Avatar config={personAvatar(p.id)} className="size-20 border-4 border-white shadow-soft" />
                  </motion.div>
                );
              })}
            </div>
            <p className="mt-6 font-display text-6xl text-plum">
              <motion.span>{text}</motion.span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {phase === "scan" ? "Comparing your 8 measurements with every profile…" : "people whose skin measures like yours"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
