"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";

// A soft, skin-toned cursor: a small dot plus a blush glow that trails behind
// and swells over anything you can press. Mouse/trackpad only; off for touch
// and reduced-motion users, and the normal text cursor stays in fields.
export function SkinCursor() {
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const gx = useSpring(x, { stiffness: 260, damping: 26, mass: 0.6 });
  const gy = useSpring(y, { stiffness: 260, damping: 26, mass: 0.6 });

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    setOn(true);
    document.documentElement.classList.add("skin-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as Element | null;
      setHover(Boolean(t?.closest("a, button, [role=button], [role=tab], [role=radio], [role=checkbox], label, select, summary, input[type=range]")));
    };
    const press = () => setDown(true);
    const release = () => setDown(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      document.documentElement.classList.remove("skin-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, [reduce, x, y]);

  if (!on) return null;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[100] rounded-full"
        style={{
          x: gx,
          y: gy,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle at 35% 35%, rgba(255,236,226,0.95), rgba(240,170,160,0.75) 55%, rgba(216,154,179,0.35) 100%)",
        }}
        animate={{ width: hover ? 46 : 26, height: hover ? 46 : 26, opacity: down ? 0.45 : hover ? 0.55 : 0.7 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[101] size-1.5 rounded-full bg-plum-deep"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: hover ? 0 : 1 }}
      />
    </>
  );
}
