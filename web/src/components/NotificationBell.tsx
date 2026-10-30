"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarHeart, Droplets, Flag, Moon, NotebookPen, PenLine, ScanFace, Settings2, Sparkles, Coffee } from "lucide-react";
import { buildNotes, type NoteKind } from "@/lib/notifications";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

const ICON: Record<NoteKind, typeof Bell> = {
  checkin: ScanFace,
  routine: CalendarHeart,
  sleep: Moon,
  rest: Coffee,
  water: Droplets,
  journal: NotebookPen,
  review: PenLine,
  goal: Flag,
  start: Sparkles,
};

// The bell: today's nudges, with an unread count. Opening it marks them read.
export function NotificationBell() {
  const { ready, scans, routine, done, reminderTimes, wellness, goal, readNotes, markNotesRead } = useStore();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const { t } = useT();
  const box = useRef<HTMLDivElement>(null);

  // Refresh once a minute so time-based nudges appear on their own.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const notes = useMemo(
    () => (ready ? buildNotes({ scans, routine, done, reminderTimes, wellness, goal }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, scans, routine, done, reminderTimes, wellness, goal, tick],
  );
  const unread = notes.filter((n) => !readNotes.includes(n.id)).length;

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markNotesRead(notes.map((n) => n.id));
        }}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-full text-plum hover:bg-blush-100"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-rose px-1 text-[9px] font-semibold leading-4 text-white">
            {unread}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-12 right-0 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-soft"
          >
            <p className="flex items-center justify-between border-b border-line px-4 py-3 text-sm font-medium">
              {t("n.today")}
              <Link href="/settings#reminders" onClick={() => setOpen(false)} className="flex items-center gap-1 text-xs font-normal text-plum">
                <Settings2 className="size-3.5" /> {t("n.reminders")}
              </Link>
            </p>
            {notes.length ? (
              <ul className="max-h-96 overflow-y-auto p-2">
                {notes.map((n) => {
                  const Icon = ICON[n.kind];
                  return (
                    <li key={n.id}>
                      <Link href={n.href} onClick={() => setOpen(false)} className="flex gap-3 rounded-2xl p-2.5 hover:bg-blush-50">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-100 text-plum"><Icon className="size-4" /></span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{n.title}</span>
                          <span className="block text-xs text-muted">{n.body}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-6 text-center text-sm text-muted">{t("n.caught")}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
