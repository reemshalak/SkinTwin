"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

// Shown to guests who have results worth keeping. Hidden once signed in.
export function SaveProfile({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const { enabled, ready, user } = useAuth();
  const { latest } = useStore();
  const path = usePathname();
  if (!enabled || !ready || user || !latest) return null;
  const dark = tone === "dark";
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-[1.75rem] p-5 ${
        dark ? "border border-white/20 bg-white/10 text-white backdrop-blur" : "border border-blush-200 bg-gradient-to-r from-blush-100 to-surface"
      } ${className}`}
    >
      <span className={`grid size-11 shrink-0 place-items-center rounded-full ${dark ? "bg-white/15" : "bg-surface text-plum shadow-card"}`}>
        <BookmarkPlus className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Save your results</p>
        <p className={`text-xs ${dark ? "text-white/75" : "text-muted"}`}>Free account, one step. Photos stay on this device.</p>
      </div>
      <Link
        href={`/signup?next=${encodeURIComponent(path)}`}
        className={`rounded-full px-5 py-2.5 text-sm font-medium ${dark ? "bg-surface text-plum-deep" : "bg-plum-deep text-white hover:bg-plum"}`}
      >
        Save profile
      </Link>
    </div>
  );
}
