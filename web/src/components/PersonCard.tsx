import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar } from "./Avatar";
import { SkinPatches } from "./SkinPatches";
import { ProductThumb } from "./ui";
import { CONCERN_KEYS, skinTypeLabel } from "@/lib/concerns";
import { HAS_PORTRAIT, personAvatar, personById, portraitPath } from "@/lib/people";
import { productById } from "@/lib/products";
import { storyOf, type Twin } from "@/lib/twins";

export function PersonCard({ twin }: { twin: Twin }) {
  const person = personById(twin.member.personId!)!;
  const { best, bestNet } = storyOf(twin.member);
  const product = productById(best.productId);
  const focus = [...CONCERN_KEYS].sort((a, b) => twin.member.scores[a] - twin.member.scores[b]).slice(0, 3);
  return (
    <Link
      href={`/twins/${person.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="relative bg-gradient-to-br from-blush-100 to-blush-200 px-4 pt-4 pb-6">
        <span className="absolute top-3 right-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-plum shadow-card">{twin.similarity}% match</span>
        <Avatar config={personAvatar(person.id)} label={`${person.name}'s avatar`} className="size-16 ring-4 ring-surface transition duration-500 group-hover:scale-105" />
        <p className="mt-3 text-base font-medium">
          {person.name}, {person.age}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-muted">
          <MapPin className="size-3" /> {person.city} · {skinTypeLabel(twin.member.scores)}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">&ldquo;{person.about}&rdquo;</p>
        {HAS_PORTRAIT.has(person.id) && <SkinPatches photo={portraitPath(person.id)} keys={focus} size="size-12" />}
        {product && bestNet > 2 && (
          <div className="mt-auto flex items-center gap-2 rounded-2xl bg-blush-50 p-2">
            <ProductThumb product={product} size="sm" />
            <p className="min-w-0 text-[11px] leading-snug">
              <span className="block text-muted">What worked</span>
              <span className="line-clamp-1 font-medium">{product.name}</span>
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
