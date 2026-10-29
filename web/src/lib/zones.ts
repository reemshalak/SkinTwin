import type { ConcernKey } from "./types";

// Where each concern shows on a front-facing 4:5 portrait, as % of width/height,
// and which side its label card sits on.
export const ZONES: Record<ConcernKey, { x: number; y: number; side: "left" | "right"; area: string }> = {
  texture: { x: 40, y: 21, side: "left", area: "Forehead" },
  oiliness: { x: 58, y: 25, side: "right", area: "T-zone" },
  wrinkle: { x: 66, y: 39, side: "right", area: "Eye corners" },
  radiance: { x: 32, y: 46, side: "left", area: "Cheekbones" },
  pore: { x: 52, y: 52, side: "right", area: "Nose" },
  moisture: { x: 30, y: 60, side: "left", area: "Cheeks" },
  redness: { x: 70, y: 60, side: "right", area: "Cheeks" },
  acne: { x: 42, y: 77, side: "left", area: "Jawline & chin" },
};

// Order labels appear in during the analysis readout.
export const ZONE_ORDER: ConcernKey[] = ["texture", "oiliness", "radiance", "wrinkle", "pore", "moisture", "redness", "acne"];

// CSS background for a zoomed patch of the photo centred on a zone.
export function patchStyle(photo: string, key: ConcernKey, zoom = 5): React.CSSProperties {
  const z = ZONES[key];
  return {
    backgroundImage: `url(${photo})`,
    backgroundSize: `${zoom * 100}% auto`,
    backgroundPosition: `${z.x}% ${z.y}%`,
    backgroundRepeat: "no-repeat",
  };
}
