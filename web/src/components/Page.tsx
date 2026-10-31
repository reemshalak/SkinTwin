import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WriteOn } from "./WriteOn";

export function Page({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12 ${className}`}>{children}</div>;
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  back,
  right,
  mark,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: { href: string; label: string };
  right?: React.ReactNode;
  mark?: string; // a word to draw a double underline under
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {back && (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm text-plum">
            <ChevronLeft className="rtl:-scale-x-100 size-4" /> {back.label}
          </Link>
        )}
        {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl leading-tight text-ink lg:text-4xl">{typeof title === "string" ? <WriteOn text={title} mark={mark} /> : title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted lg:text-base">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
