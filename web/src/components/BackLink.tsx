"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

// Goes back to the page you came from; falls back to `href` when opened directly.
export function BackLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(href))}
      className={className}
    >
      <ChevronLeft className="size-4 rtl:rotate-180" /> {children}
    </button>
  );
}
