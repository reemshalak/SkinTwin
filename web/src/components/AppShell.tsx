"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { ReminderTicker } from "./ReminderTicker";
import { SiteFooter } from "./SiteFooter";
import { TopBar } from "./TopBar";
import { Tour } from "./Tour";

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
    </div>
  );
}
