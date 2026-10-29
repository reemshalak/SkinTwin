"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function NextStep({ href, label, hint }: { href: string; label: string; hint?: string }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-2 border-t border-line pt-8 text-center">
      {hint && <p className="max-w-md text-sm text-muted">{hint}</p>}
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose to-plum px-8 py-4 text-sm font-medium text-white shadow-soft transition hover:brightness-105"
      >
        {label} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
