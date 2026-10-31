"use client";

import { useEffect } from "react";
import { translateAr } from "@/lib/i18n-ar-auto";

const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const SKIP = "script,style,textarea,input,code,[contenteditable],[data-no-translate]";

// In Arabic, translates English UI text that components write directly (not through t()).
// It only swaps text values, never adds or removes nodes, so React keeps working; if React
// writes English back, the observer translates it again.
export function AutoArabic() {
  useEffect(() => {
    const writes = new WeakMap<Node, number>();
    const textNode = (n: Text) => {
      const v = n.nodeValue ?? "";
      if (!/[A-Za-z]/.test(v) || n.parentElement?.closest(SKIP)) return;
      if (v.includes("⁨")) return;
      const ar = translateAr(v);
      // English left as is (product names, "120 ml") is isolated so RTL doesn't reorder it
      // ("2% BHA Toner" would otherwise read "BHA Toner 2%").
      // Text that is already Arabic (with a brand name like YouCam inside) is left alone.
      if (!ar && /[؀-ۿ]/.test(v)) return;
      const next = ar ? v.replace(v.trim(), ar) : v.replace(v.trim(), `⁨${v.trim()}⁩`);
      // Writing an unchanged value still fires the observer, so only write real changes,
      // and never rewrite the same node endlessly (a fast-ticking counter is fine: it changes value).
      if (next === v) return;
      const count = (writes.get(n) ?? 0) + 1;
      if (count > 200) return;
      writes.set(n, count);
      n.nodeValue = next;
    };
    const element = (el: Element) => {
      // Form fields keep what people type, but their placeholder and labels are translated.
      if (el.closest("script,style,[data-no-translate]")) return;
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (!v || !/[A-Za-z]/.test(v)) continue;
        const ar = translateAr(v);
        if (ar && ar !== v) el.setAttribute(a, ar);
      }
    };
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return textNode(root as Text);
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      element(root as Element);
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (n.nodeType === Node.TEXT_NODE) textNode(n as Text);
        else element(n as Element);
      }
    };

    walk(document.body);
    // Observer callbacks run right after React's commit, before paint, so English never flashes.
    const obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "childList") m.addedNodes.forEach((n) => n.isConnected && walk(n));
        else if (m.target.isConnected) walk(m.target);
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    return () => obs.disconnect();
  }, []);
  return null;
}
