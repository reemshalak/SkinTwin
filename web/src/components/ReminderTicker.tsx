"use client";

import { useEffect } from "react";
import { buildNotes } from "@/lib/notifications";
import { useStore } from "@/lib/store";

// While SkinTwin is open, timely inbox items (routine, bedtime, rest, water,
// check-in) also arrive as browser notifications, once each.
export function ReminderTicker() {
  const { reminders, scans, routine, done, reminderTimes, wellness, goal } = useStore();
  useEffect(() => {
    if (!reminders || typeof Notification === "undefined") return;
    const check = () => {
      if (Notification.permission !== "granted") return;
      for (const n of buildNotes({ scans, routine, done, reminderTimes, wellness, goal })) {
        if (!n.alert) continue;
        const key = `skintwin:alerted:${n.id}`;
        try {
          if (localStorage.getItem(key)) continue;
          localStorage.setItem(key, "1");
        } catch {
          continue;
        }
        new Notification(n.title, { body: n.body, tag: n.id });
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [reminders, scans, routine, done, reminderTimes, wellness, goal]);
  return null;
}
