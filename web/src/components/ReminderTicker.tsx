"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

const TEXT = { am: "Time for your morning routine ☀️", pm: "Time for your evening routine 🌙" } as const;

// Fires a browser notification at routine time while the app is open.
export function ReminderTicker() {
  const { reminders, routine, reminderTimes } = useStore();
  useEffect(() => {
    if (!reminders || typeof Notification === "undefined") return;
    const check = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      for (const slot of ["am", "pm"] as const) {
        const t = { slot, text: TEXT[slot] };
        const [h, m] = reminderTimes[slot].split(":").map(Number);
        const key = `skintwin:reminded:${slot}:${now.toDateString()}`;
        const due = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
        if (!due || now.getHours() > h + 1 || localStorage.getItem(key)) continue;
        const count = routine.filter((r) => r.slot === t.slot).length;
        if (!count) continue;
        try {
          localStorage.setItem(key, "1");
        } catch {}
        new Notification("SkinTwin", { body: `${t.text} · ${count} step${count === 1 ? "" : "s"}` });
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [reminders, routine, reminderTimes]);
  return null;
}
