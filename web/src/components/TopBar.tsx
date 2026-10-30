"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ScanFace, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";
import { useT } from "@/lib/i18n";
import { LanguagePicker } from "./LanguagePicker";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

// The loop: who's like me -> what works -> my plan -> my skin.
const LINKS = [
  { href: "/", label: "nav.home", tour: "home" },
  { href: "/twins", label: "nav.twins", tour: "twins" },
  { href: "/shop", label: "nav.products", tour: "products" },
  { href: "/routine", label: "nav.plan", tour: "plan" },
  { href: "/me", label: "nav.skin", tour: "skin" },
] as const;

export function TopBar() {
  const path = usePathname();
  const { latest } = useStore();
  const { t } = useT();
  const { enabled, user } = useAuth();
  // Without accounts set up, everything lives on this device: treat as signed in.
  const signedIn = !enabled || Boolean(user);
  const onAuth = path === "/signup" || path === "/login";
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-blush-50/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
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
                {t(l.label)}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <span className="hidden sm:block"><HeaderSearch /></span>
          {signedIn ? (
            <>
              <Link href="/scan" data-tour="checkin" className="me-2 hidden items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2 text-sm font-medium text-white transition hover:bg-plum lg:inline-flex">
                <ScanFace className="size-4" /> {latest ? t("nav.checkin") : t("nav.startScan")}
              </Link>
              {/* Account cluster on the far edge: bell, then avatar */}
              <NotificationBell />
              <ProfileMenu />
            </>
          ) : (
            <>
              <LanguagePicker />
              {!onAuth && (
                <Link href="/scan" data-tour="checkin" className="ms-1 hidden items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2 text-sm font-medium text-white transition hover:bg-plum lg:inline-flex">
                  <ScanFace className="size-4" /> {latest ? t("nav.checkin") : t("nav.startScan")}
                </Link>
              )}
              <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
              <AuthLinks />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Signed out: Log in and Sign up on the far edge, like most shops.
function AuthLinks() {
  const { ready } = useAuth();
  const { t } = useT();
  const path = usePathname();
  if (!ready) return <span className="w-24" aria-hidden />;
  if (path === "/signup" || path === "/login") return null;
  const next = `?next=${encodeURIComponent(path)}`;
  return (
    <div className="flex items-center gap-1">
      <Link href={`/login${next}`} className="rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-blush-100">
        {t("nav.login")}
      </Link>
      <Link href={`/signup${next}`} className="hidden rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-plum-deep shadow-card hover:border-plum sm:inline-block">
        {t("nav.signup")}
      </Link>
    </div>
  );
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

