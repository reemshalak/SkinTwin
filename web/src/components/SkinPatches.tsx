import { CONCERNS } from "@/lib/concerns";
import type { ConcernKey } from "@/lib/types";
import { patchStyle, ZONES } from "@/lib/zones";

// Close-up squares of skin instead of a face: proof without identity.
export function SkinPatches({ photo, keys, size = "size-16", labels = true }: { photo: string; keys: ConcernKey[]; size?: string; labels?: boolean }) {
  return (
    <div className="flex gap-2">
      {keys.map((k) => (
        <figure key={k} className="text-center">
          <span className={`block rounded-xl border border-line ${size}`} style={patchStyle(photo, k, 5)} role="img" aria-label={`${ZONES[k].area} close-up`} />
          {labels && <figcaption className="mt-1 text-[10px] text-muted">{CONCERNS[k].label}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
