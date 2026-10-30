"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanFace } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" className="font-display text-2xl text-plum-deep">
          SkinTwin
        </Link>
        <div className="flex items-center gap-2">
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-tour={l.tour}
                aria-current={(l.href === "/" ? path === "/" : path.startsWith(l.href)) ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition ${(l.href === "/" ? path === "/" : path.startsWith(l.href)) ? "bg-blush-100 text-plum" : "text-muted hover:text-plum"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/scan" data-tour="checkin" className="hidden items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2 text-sm font-medium text-white transition hover:bg-plum sm:inline-flex">
            <ScanFace className="size-4" /> {latest ? "Check-in" : "Start scan"}
          </Link>
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
        <Link href={`/login${next}`} className="rounded-full px-3 py-2 text-sm text-plum hover:bg-blush-100">
          Log in
        </Link>
        <Link href={`/signup${next}`} className="rounded-full border border-plum/40 px-4 py-2 text-sm font-medium text-plum-deep hover:bg-blush-100">
          Sign up
        </Link>
      </div>
    );
  }
  return <ProfileMenu />;
}
