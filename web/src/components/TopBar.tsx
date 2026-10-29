"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanFace } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/shop", label: "Discover" },
  { href: "/twins", label: "Twins" },
  { href: "/journal", label: "Journal" },
  { href: "/routine", label: "My plan" },
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
                aria-current={path.startsWith(l.href) ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition ${path.startsWith(l.href) ? "bg-blush-100 text-plum" : "text-muted hover:text-plum"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/scan" className="hidden items-center gap-1.5 rounded-full bg-plum-deep px-4 py-2 text-sm font-medium text-white transition hover:bg-plum sm:inline-flex">
            <ScanFace className="size-4" /> {latest ? "Check-in" : "Start scan"}
          </Link>
          <ProfileLink />
        </div>
      </div>
    </header>
  );
}

// Guests get a nudge to save or log in next to the account menu.
function ProfileLink() {
  const { latest } = useStore();
  const { enabled, user } = useAuth();
  const path = usePathname();
  const onAuth = path === "/signup" || path === "/login";
  return (
    <>
      {enabled && !user && !onAuth && (
        <Link
          href={latest ? `/signup?next=${encodeURIComponent(path)}` : "/login"}
          className="hidden rounded-full px-3 py-2 text-sm text-plum hover:bg-blush-100 sm:inline"
        >
          {latest ? "Save profile" : "Log in"}
        </Link>
      )}
      <ProfileMenu />
    </>
  );
}
