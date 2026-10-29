import { hashString } from "@/lib/random";

// Letter avatars: a coloured circle with the person's initial. The public
// identity on SkinTwin; scan photos are never used here.
export interface AvatarConfig {
  initial: string;
  color: number;
}

// Shades of the brand pink, deep enough for white initials to stay readable.
const COLORS = ["#9c5a78", "#b9567f", "#a3497a", "#c0628a", "#8a4766", "#b04f74", "#93506f", "#c4577f"];

export function avatarFromSeed(seed: string, name = ""): AvatarConfig {
  return { initial: name.trim().charAt(0).toUpperCase(), color: hashString(seed) % COLORS.length };
}

export function Avatar({ config, label, className = "" }: { config: AvatarConfig; label?: string; className?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-medium text-white select-none ${className}`}
      style={{ backgroundColor: COLORS[config.color % COLORS.length], containerType: "size" }}
    >
      {config.initial ? (
        <span style={{ fontSize: "45cqh", lineHeight: 1 }}>{config.initial}</span>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="currentColor" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z" />
        </svg>
      )}
    </span>
  );
}
