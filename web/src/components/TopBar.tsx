"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Search, ScanFace, Sun, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

// The loop: who's like me -> what works -> my plan -> my skin.
const LINKS = [
  { href: "/", label: "Home", tour: "home" },
  { href: "/twins", label: "Twins", tour: "twins" },
  { href: "/shop", label: "Products", tour: "products" },
  { href: "/routine", label: "Plan", tour: "plan" },
  { href: "/me", label: "My skin", tour: "skin" },
];

export function TopBar() {
  const path = usePathname();
  const { latest } = useStore();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-blush-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5 lg:px-8">
        <Link href="/" className="font-display text-2xl text-plum-deep">
          SkinTwin
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {LINKS.map((l) => {
            const on = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                data-tour={l.tour}
                aria-current={on ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition ${on ? "bg-blush-100 text-plum" : "text-muted hover:text-plum"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <span className="hidden sm:block"><HeaderSearch /></span>
          <NotificationBell />
          <ThemeSwitch />
          <Link href="/scan" data-tour="checkin" className="ml-1 hidden items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2 text-sm font-medium text-white transition hover:bg-plum lg:inline-flex">
            <ScanFace className="size-4" /> {latest ? "Check-in" : "Start scan"}
          </Link>
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
          <ProfileLink />
        </div>
      </div>
    </header>
  );
}

// Signed in: the account menu. Not signed in: Log in and Sign up, like most sites.
function ProfileLink() {
  const { enabled, ready, user } = useAuth();
  const path = usePathname();
  const onAuth = path === "/signup" || path === "/login";
  if (enabled && !ready) return <span className="size-9" aria-hidden />;
  if (enabled && !user) {
    if (onAuth) return null;
    const next = `?next=${encodeURIComponent(path)}`;
    return (
      <div className="flex items-center gap-1">
        <Link href={`/login${next}`} className="rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-blush-100">
          Log in
        </Link>
        <Link href={`/signup${next}`} className="hidden rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-plum-deep shadow-card hover:border-plum sm:inline-block">
          Sign up
        </Link>
      </div>
    );
  }
  return <ProfileMenu />;
}

// Search from anywhere: products, ingredients or concerns, answered on Products.
function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const path = usePathname();
  // Already on Products: tell the page directly; otherwise open it with ?q=.
  const go = (term: string) => {
    if (path === "/shop") window.dispatchEvent(new CustomEvent("skintwin:search", { detail: term }));
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label="Search" aria-expanded={open} className="grid size-9 place-items-center rounded-full text-plum hover:bg-blush-100">
        {open ? <X className="size-4" /> : <Search className="size-4" />}
      </button>
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!q.trim()) return;
            setOpen(false);
            go(q.trim());
          }}
          className="absolute top-12 right-0 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-line bg-surface p-2 shadow-soft"
        >
          <label className="flex items-center gap-2 rounded-full bg-blush-50 px-3 py-2">
            <Search className="size-4 text-muted" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Products, ingredients, concerns…"
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <p className="mt-2 flex flex-wrap gap-1.5 px-1 pb-1">
            {["Niacinamide", "Retinol", "Fragrance-free", "SPF"].map((t) => (
              <button key={t} type="button" onClick={() => { setOpen(false); go(t); }} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted hover:border-plum hover:text-plum">
                {t}
              </button>
            ))}
          </p>
        </form>
      )}
    </div>
  );
}

// Light / dark in one tap, for everyone (signed in or not).
function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [theme]);
  return (
    <button onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="grid size-9 place-items-center rounded-full text-plum hover:bg-blush-100">
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
