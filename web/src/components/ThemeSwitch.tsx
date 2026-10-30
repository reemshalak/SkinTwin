"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

// Light / dark in one tap (footer for everyone; the account menu when signed in).
export function ThemeSwitch({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [theme]);
  return (
    <button onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className={`${withLabel ? "flex h-9 items-center px-2" : "grid size-9 place-items-center"} rounded-full text-plum hover:bg-blush-100`}>
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      {withLabel && <span className="ms-1 text-xs">{dark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
