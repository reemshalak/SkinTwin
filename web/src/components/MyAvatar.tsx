"use client";

import { Avatar, avatarFromSeed } from "./Avatar";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

// The current user's public avatar: their chosen illustration, never a scan photo.
export function useMyIdentity() {
  const { identity } = useStore();
  const auth = useAuth();
  const name = identity.displayName || auth.name || "";
  const avatar = avatarFromSeed(auth.user?.email ?? (name || "guest-skintwin"), name);
  return { name, avatar };
}

export function MyAvatar({ className = "size-9" }: { className?: string }) {
  const { name, avatar } = useMyIdentity();
  return <Avatar config={avatar} label={name ? `${name}'s avatar` : "Your avatar"} className={className} />;
}
