"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomNav } from "./BottomNav";
import { ReminderTicker } from "./ReminderTicker";
import { SiteFooter } from "./SiteFooter";
import { TopBar } from "./TopBar";
import { Tour } from "./Tour";
import { SkinCursor } from "./SkinCursor";

// Full-screen app: sticky top bar with the journey on every size,
// bottom tab bar on phones only.
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const immersive = path === "/analysis" || path === "/mirror";
  const showBottom = path !== "/scan" && !immersive;
  return (
    <div className="min-h-dvh bg-blush-50">
      {!immersive && <TopBar />}
      <main className={showBottom ? "pb-28 lg:pb-0" : ""}>
        {children}
        {!immersive && path !== "/scan" && <SiteFooter />}
      </main>
      {showBottom && <BottomNav />}
      <ReminderTicker />
      <Tour />
      <SkinCursor />
      <PageWash path={path} />
    </div>
  );
}

// Soft blush wash on each page change. Opacity only (fixed layouts stay intact),
// and it removes itself on a timer even if animations are paused.
function PageWash({ path }: { path: string }) {
  const [shown, setShown] = useState<string | null>(null);
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (first) return setFirst(false);
    setShown(path);
    const id = setTimeout(() => setShown(null), 600);
    return () => clearTimeout(id);
    // Only on path changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  if (!shown) return null;
  return (
    <div
      key={shown}
      aria-hidden
      className="animate-page-wash pointer-events-none fixed inset-0 z-[55]"
      style={{ background: "radial-gradient(ellipse at 50% 40%, var(--color-blush-50), var(--color-blush-100) 60%, var(--color-blush-200))" }}
    />
  );
}
