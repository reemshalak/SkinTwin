import Link from "next/link";
import { ScanFace } from "lucide-react";

export function NeedScan({ what }: { what: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-[2rem] border border-line bg-surface p-10 text-center shadow-card">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush-100 text-plum">
        <ScanFace className="size-6" />
      </span>
      <p className="mt-4 font-display text-2xl">Start with a scan</p>
      <p className="mt-1 text-sm text-muted">We need one skin scan to show {what}.</p>
      <Link href="/scan" className="mt-6 inline-block rounded-full bg-plum px-7 py-3 text-sm font-medium text-white">
        Scan my skin
      </Link>
    </div>
  );
}
