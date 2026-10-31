"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Trash2 } from "lucide-react";
import { MyAvatar } from "./MyAvatar";
import { useStore } from "@/lib/store";

const SIZE = 192;

// Square-crops and shrinks a picked image so it stays small enough to sync.
async function toAvatar(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    canvas.getContext("2d")!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Your avatar with a camera badge: upload, change or remove a profile photo.
export function AvatarEditor({ className = "size-28 text-5xl" }: { className?: string }) {
  const { identity, setIdentity } = useStore();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  async function pick(file?: File) {
    setOpen(false);
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Pick an image file.");
    try {
      setIdentity({ avatar: await toAvatar(file) });
    } catch {
      setError("Couldn't read that image.");
    }
  }

  return (
    <div ref={box} className="relative inline-block">
      <button onClick={() => (identity.avatar ? setOpen((v) => !v) : input.current?.click())} aria-label={identity.avatar ? "Change profile photo" : "Add a profile photo"} className="group relative block rounded-full">
        <MyAvatar className={`${className} ring-[6px] ring-blush-50 transition group-hover:brightness-95`} />
        <span className="absolute end-1 bottom-1 grid size-9 place-items-center rounded-full border-2 border-blush-50 bg-plum-deep text-white shadow-card transition group-hover:scale-110">
          <Camera className="size-4" />
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full start-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1 text-sm shadow-soft">
            <button onClick={() => input.current?.click()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start hover:bg-blush-50">
              <ImageUp className="size-4 text-plum" /> Change photo
            </button>
            <button onClick={() => { setIdentity({ avatar: undefined }); setOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-bad hover:bg-bad-soft">
              <Trash2 className="size-4" /> Remove photo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="absolute top-full mt-2 w-56 text-xs text-bad">{error}</p>}
    </div>
  );
}
