"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { ReminderTicker } from "./ReminderTicker";
import { SiteFooter } from "./SiteFooter";
import { TopBar } from "./TopBar";
import { Tour } from "./Tour";
import { SkinCursor } from "./SkinCursor";

// Full-screen app: sticky top bar with the journey on every size,
// bottom tab bar on phones only.
import { Celebrations } from "./Celebrate";
import { RegisterSW } from "./RegisterSW";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const immersive = path === "/analysis" || path === "/mirror";
  const showBottom = path !== "/scan" && !immersive;
  return (
    <div className="min-h-dvh">
      {!immersive && <TopBar />}
      <main className={showBottom ? "pb-28 lg:pb-0" : ""}>
        {children}
        {!immersive && path !== "/scan" && <SiteFooter />}
      </main>
      <Celebrations />
      <RegisterSW />
      {showBottom && <BottomNav />}
      <ReminderTicker />
      <Tour />
      <SkinCursor />
    </div>
  );
}
