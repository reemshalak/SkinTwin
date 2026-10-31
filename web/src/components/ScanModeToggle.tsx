"use client";

import { motion } from "motion/react";
import { FlaskConical, Zap } from "lucide-react";
import { useStore } from "@/lib/store";

// Demo scores cost nothing; live YouCam analysis spends 12 API units per new photo.
export function ScanModeToggle({ className = "" }: { className?: string }) {
  const { liveScans, setLiveScans } = useStore();
  const options = [
    { live: false, label: "Demo", hint: "Free, simulated scores", icon: FlaskConical },
    { live: true, label: "YouCam live", hint: "Real AI analysis · uses credits", icon: Zap },
  ];
  return (
    <div className={className}>
      <div role="radiogroup" aria-label="Scan mode" className="grid grid-cols-2 gap-1 rounded-2xl bg-blush-100 p-1">
        {options.map(({ live, label, hint, icon: Icon }) => {
          const on = liveScans === live;
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setLiveScans(live)}
              className={`relative rounded-xl px-3 py-2 text-start transition ${on ? "text-plum" : "text-muted hover:text-plum"}`}
            >
              {on && <motion.span layoutId="scan-mode" className="absolute inset-0 rounded-xl bg-surface shadow-card" />}
              <span className="relative flex items-center gap-1.5 text-sm font-medium">
                <Icon className="size-4" /> {label}
              </span>
              <span className="relative block text-[10px] text-muted">{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
