import type { Product } from "@/lib/types";

// Two colours from the product's gradient, e.g. "from-[#F6EDF3] to-[#F0C9D9]".
export function productColors(p: Product) {
  const hex = p.hue.match(/#[0-9a-fA-F]{6}/g) ?? ["#F6EDF3", "#F0C9D9"];
  return { light: hex[0], deep: hex[1] ?? hex[0] };
}

const SHAPE: Record<Product["category"], "dropper" | "jar" | "tube" | "bottle" | "stick"> = {
  serum: "dropper",
  treatment: "dropper",
  moisturizer: "jar",
  sunscreen: "tube",
  exfoliant: "bottle",
  cleanser: "bottle",
  makeup: "tube",
};

// Illustrated packshot until real product photography exists.
export function ProductArt({ product, className = "" }: { product: Product; className?: string }) {
  const { deep } = productColors(product);
  const shape = product.id.includes("lip") ? "stick" : SHAPE[product.category];
  const label = (
    <>
      <text x="60" y="0" textAnchor="middle" fontSize="6" letterSpacing="1" fill="#7a3f5c" opacity="0.75">
        {product.brand.toUpperCase()}
      </text>
    </>
  );
  return (
    <svg viewBox="0 0 120 160" className={className} role="img" aria-label={`${product.name} packshot`}>
      <defs>
        <linearGradient id={`glass-${product.id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`fill-${product.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={deep} stopOpacity="0.55" />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="150" rx="34" ry="5" fill="#3a2430" opacity="0.12" />
      {shape === "dropper" && (
        <g>
          <rect x="52" y="10" width="16" height="26" rx="7" fill="#3a2430" opacity="0.85" />
          <rect x="47" y="34" width="26" height="12" rx="2" fill="#c9a78c" />
          <rect x="36" y="46" width="48" height="100" rx="12" fill={`url(#glass-${product.id})`} stroke="#ffffff" />
          <rect x="40" y="80" width="40" height="62" rx="9" fill={`url(#fill-${product.id})`} />
          <rect x="40" y="62" width="40" height="34" rx="3" fill="#fffaf8" />
          <g transform="translate(0 74)">{label}</g>
          <text x="60" y="88" textAnchor="middle" fontSize="6" fill="#3a2430" opacity="0.6">{product.size}</text>
        </g>
      )}
      {shape === "jar" && (
        <g>
          <rect x="24" y="62" width="72" height="22" rx="6" fill="#3a2430" opacity="0.85" />
          <rect x="20" y="82" width="80" height="64" rx="14" fill={`url(#glass-${product.id})`} stroke="#ffffff" />
          <rect x="24" y="100" width="72" height="42" rx="10" fill={`url(#fill-${product.id})`} />
          <rect x="30" y="92" width="60" height="26" rx="3" fill="#fffaf8" />
          <g transform="translate(0 103)">{label}</g>
          <text x="60" y="113" textAnchor="middle" fontSize="6" fill="#3a2430" opacity="0.6">{product.size}</text>
        </g>
      )}
      {shape === "tube" && (
        <g transform="rotate(-8 60 80)">
          <path d="M40 18 H80 L86 128 H34 Z" fill={`url(#fill-${product.id})`} />
          <path d="M40 18 H80 L83 70 H37 Z" fill="#ffffff" opacity="0.55" />
          <rect x="44" y="128" width="32" height="20" rx="4" fill="#3a2430" opacity="0.85" />
          <rect x="38" y="12" width="44" height="8" rx="2" fill="#fffaf8" />
          <g transform="translate(0 52)">{label}</g>
          <text x="60" y="62" textAnchor="middle" fontSize="6" fill="#3a2430" opacity="0.6">{product.size}</text>
        </g>
      )}
      {shape === "bottle" && (
        <g>
          <rect x="50" y="12" width="20" height="18" rx="4" fill="#3a2430" opacity="0.85" />
          <path d="M44 30 H76 V42 C90 48 92 56 92 66 V136 C92 142 88 146 82 146 H38 C32 146 28 142 28 136 V66 C28 56 30 48 44 42 Z" fill={`url(#glass-${product.id})`} stroke="#ffffff" />
          <path d="M32 84 H88 V136 C88 140 85 142 82 142 H38 C35 142 32 140 32 136 Z" fill={`url(#fill-${product.id})`} />
          <rect x="34" y="70" width="52" height="30" rx="3" fill="#fffaf8" />
          <g transform="translate(0 83)">{label}</g>
          <text x="60" y="93" textAnchor="middle" fontSize="6" fill="#3a2430" opacity="0.6">{product.size}</text>
        </g>
      )}
      {shape === "stick" && (
        <g>
          <path d="M48 26 L72 18 V58 H48 Z" fill={deep} />
          <rect x="44" y="56" width="32" height="20" rx="2" fill="#c9a78c" />
          <rect x="40" y="74" width="40" height="72" rx="6" fill="#3a2430" opacity="0.9" />
          <text x="60" y="112" textAnchor="middle" fontSize="6" letterSpacing="1.2" fill="#fffaf8" opacity="0.85">
            {product.brand.toUpperCase()}
          </text>
        </g>
      )}
      <rect x="0" y="0" width="120" height="160" fill="none" />
    </svg>
  );
}

// Real product photo when we have one, else the illustration. Multiply blending
// lets a photo's white background melt into the coloured backdrop.
export function ProductVisual({ product, className = "" }: { product: Product; className?: string }) {
  if (product.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={product.image} alt={`${product.brand} ${product.name}`} className={`rounded-2xl object-contain mix-blend-multiply ${className}`} loading="lazy" />
    );
  }
  return <ProductArt product={product} className={className} />;
}
