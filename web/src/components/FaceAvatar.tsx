"use client";

import { useEffect, useState } from "react";

// Shows the sample photo once it has loaded; otherwise a soft illustrated placeholder.
export function FaceAvatar({ src, tone, alt, className = "" }: { src?: string; tone: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (!src) return;
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);

  if (loaded && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`block object-cover ${className}`} />
    );
  }
  return (
    <div role="img" aria-label={alt || undefined} aria-hidden={alt ? undefined : true} className={`relative overflow-hidden bg-gradient-to-b from-blush-100 to-blush-200 ${className}`}>
      <svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 h-full w-full" aria-hidden>
        <ellipse cx="50" cy="118" rx="42" ry="30" fill={tone} opacity="0.55" />
        <rect x="42" y="66" width="16" height="22" rx="6" fill={tone} opacity="0.85" />
        <ellipse cx="50" cy="50" rx="23" ry="28" fill={tone} />
        <path d="M26 46 C26 20 74 20 74 46 C70 34 58 28 50 28 C42 28 30 34 26 46Z" fill="#3a2430" opacity="0.8" />
      </svg>
    </div>
  );
}
