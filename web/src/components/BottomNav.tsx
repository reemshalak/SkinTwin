"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { CalendarHeart, Compass, House, ScanFace, Users } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/twins", label: "Twins", icon: Users },
  { href: "/scan", label: "Check-in", icon: ScanFace, center: true },
  { href: "/shop", label: "Products", icon: Compass },
  { href: "/routine", label: "Plan", icon: CalendarHeart },
];

export function BottomNav() {
  const path = usePathname();
  const { latest } = useStore();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 lg:hidden">
      <ul className="flex items-end justify-between rounded-3xl border border-line bg-surface/90 px-3 py-2 shadow-card backdrop-blur">
        {ITEMS.map(({ href, label, icon: Icon, center }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          if (center) {
            return (
              <li key={href} className="-mt-8">
                <Link
                  href={href}
                  aria-label={latest ? "Weekly check-in" : "Scan my skin"}
                  className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-rose to-plum text-white shadow-soft ring-4 ring-blush-50 transition hover:scale-105"
                >
                  <Icon className="size-7" strokeWidth={1.6} />
                </Link>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex w-14 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] transition ${
                  active ? "text-plum" : "text-muted hover:text-plum"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2 : 1.6} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
