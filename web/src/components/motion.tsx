"use client";

import { animate, motion, MotionConfig, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Fades and lifts content in the first time it scrolls into view.
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

export function Stagger({ children, className, as = "ul" }: { children: React.ReactNode; className?: string; as?: "ul" | "ol" | "div" }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, className, as = "li" }: { children: React.ReactNode; className?: string; as?: "li" | "div" }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={item}>
      {children}
    </Tag>
  );
}

// Counts from 0 (or the previous value) to `value` when visible.
export function CountUp({ value, decimals = 0, duration = 1.2, className }: { value: number; decimals?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: EASE });
    return () => controls.stop();
  }, [inView, value, duration, mv]);
  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}

// Ring arc that draws itself to `value` percent.
export function MotionCircle({ cx, cy, r, c, value }: { cx: number; cy: number; r: number; c: number; value: number }) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray={c}
      initial={{ strokeDashoffset: c }}
      animate={{ strokeDashoffset: c * (1 - value / 100) }}
      transition={{ duration: 1.4, ease: EASE, delay: 0.15 }}
    />
  );
}

// Progress bar that grows to its width when it scrolls into view.
export function GrowBar({ value, className, delay = 0 }: { value: number; className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ width: 0 }}
      whileInView={{ width: `${Math.max(3, Math.min(100, value))}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    />
  );
}
