"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Bookmark, CalendarHeart, CircleUserRound, LogIn, LogOut, Monitor, Moon, ScanFace, Settings, Sun, UserPlus } from "lucide-react";
import { MyAvatar, useMyIdentity } from "./MyAvatar";
import { EASE } from "./motion";
import { useAuth } from "@/lib/auth";
import { skinTypeLabel } from "@/lib/concerns";
import { useStore } from "@/lib/store";
import { useTheme, type ThemePref } from "@/lib/theme";

const THEMES: { id: ThemePref; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Auto", icon: Monitor },
];

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const { latest, savedTwins, savedProducts } = useStore();
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const me = useMyIdentity();
  const saved = savedTwins.length + savedProducts.length;

  // Close on navigation, outside click and Escape.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    latest && { href: "/me", label: "My profile", icon: CircleUserRound },
    latest && { href: "/analysis", label: "My skin map", icon: ScanFace },
    { href: "/routine", label: "My plan", icon: CalendarHeart },
    { href: "/me#saved", label: "Saved", icon: Bookmark, count: saved },
    { href: "/settings", label: "Settings", icon: Settings },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Sun; count?: number }[];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        data-tour="skin"
        aria-haspopup="menu"
        aria-expanded={open}
        className="ml-1 block shrink-0 rounded-full ring-2 ring-blush-200 ring-offset-2 ring-offset-blush-50 transition hover:ring-plum"
      >
        <MyAvatar className="size-9" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute right-0 z-50 mt-3 w-72 origin-top-right overflow-hidden rounded-3xl border border-line bg-surface shadow-soft"
          >
            <div className="flex items-center gap-3 border-b border-line p-4">
              <MyAvatar className="size-11" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{me.name || (auth.user ? "Your account" : "Guest")}</p>
                <p className="truncate text-xs text-muted">{auth.user?.email ?? "Results saved on this device"}</p>
                {latest && (
                  <p className="mt-1 inline-block rounded-full bg-blush-100 px-2 py-0.5 text-[10px] text-plum">
                    {skinTypeLabel(latest.scores)} · {latest.overall}/100
                  </p>
                )}
              </div>
            </div>

            <nav className="p-2">
              {items.map(({ href, label, icon: Icon, count }) => (
                <Link key={label} href={href} role="menuitem" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition hover:bg-blush-100">
                  <Icon className="size-4 text-muted" />
                  <span className="flex-1">{label}</span>
                  {count ? <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[10px] text-plum">{count}</span> : null}
                </Link>
              ))}
            </nav>

            <div className="border-t border-line p-3">
              <p className="px-1 pb-2 text-[11px] text-muted">Appearance</p>
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-blush-100 p-1" role="radiogroup" aria-label="Theme">
                {THEMES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    role="radio"
                    aria-checked={theme === id}
                    onClick={() => setTheme(id)}
                    className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs transition ${theme === id ? "text-plum" : "text-muted hover:text-plum"}`}
                  >
                    {theme === id && <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-xl bg-surface shadow-card" />}
                    <Icon className="relative size-3.5" />
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-line p-2">
              {auth.user ? (
                <button onClick={auth.signOut} role="menuitem" className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-bad transition hover:bg-bad-soft">
                  <LogOut className="size-4" /> Sign out
                </button>
              ) : auth.enabled ? (
                <div className="grid grid-cols-2 gap-2 p-1">
                  <Link href={`/login?next=${encodeURIComponent(path)}`} className="flex items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-sm text-plum">
                    <LogIn className="size-4" /> Log in
                  </Link>
                  <Link href={`/signup?next=${encodeURIComponent(path)}`} className="flex items-center justify-center gap-1.5 rounded-full bg-plum-deep py-2.5 text-sm text-white">
                    <UserPlus className="size-4" /> Sign up
                  </Link>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
