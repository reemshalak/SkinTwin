"use client";

import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { useStore } from "@/lib/store";

// Toggles a product in the saved list. Stops the click so it works inside card links.
export function SaveHeart({ productId, className = "" }: { productId: string; className?: string }) {
  const { savedProducts, toggleSavedProduct } = useStore();
  const saved = savedProducts.includes(productId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save product"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSavedProduct(productId);
      }}
      className={`grid size-9 place-items-center rounded-full bg-surface/90 shadow-card transition hover:scale-105 ${saved ? "text-rose" : "text-muted hover:text-rose"} ${className}`}
    >
      <motion.span key={String(saved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <Heart className={`size-4 ${saved ? "fill-rose" : ""}`} />
      </motion.span>
    </button>
  );
}
