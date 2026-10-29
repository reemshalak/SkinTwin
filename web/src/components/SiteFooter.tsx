import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-muted lg:px-8">
        <p className="font-display text-base text-plum-deep">SkinTwin</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/twins" className="hover:text-plum">Twins</Link>
          <Link href="/journal" className="hover:text-plum">Journal</Link>
          <Link href="/settings" className="hover:text-plum">Settings & privacy</Link>
          <Link href="/merchant" className="hover:text-plum">For brands</Link>
        </nav>
        <p className="w-full text-[11px] leading-relaxed">
          Skin analysis by YouCam AI · Demo product catalogue with fictional brands · Community results shown are sample data · Cosmetic guidance, not a
          medical diagnosis.
        </p>
      </div>
    </footer>
  );
}
