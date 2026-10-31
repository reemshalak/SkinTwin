"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { Check, Eye, EyeOff, Loader2, Lock, MailCheck } from "lucide-react";
import { Avatar, avatarFromSeed } from "./Avatar";
import { EASE } from "./motion";
import { skinTypeLabel } from "@/lib/concerns";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useTwins } from "@/lib/use-twins";

const PERKS = ["Keep your skin map and scores", "Track progress week by week", "Save twins and your routine on any device"];

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/me";
  const { enabled, signUp, signIn } = useAuth();
  const { latest } = useStore();
  const { twins } = useTwins();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const { identity, setIdentity } = useStore();
  const preview = avatarFromSeed(email || name || "guest-skintwin", mode === "signup" ? name : identity.displayName);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Use at least 6 characters for your password.");
    setBusy(true);
    const res = mode === "signup" ? await signUp(name.trim(), email.trim(), password) : await signIn(email.trim(), password);
    setBusy(false);
    if (res.error) return setError(res.error);
    if (mode === "signup") setIdentity({ displayName: name.trim() });
    if ("needsConfirm" in res && res.needsConfirm) return setSent(true);
    router.push(next);
  }

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:px-8">
      {/* Visual side: what you're saving */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="relative hidden lg:block">
        <div className="glow-card relative mx-auto max-w-sm overflow-hidden rounded-[2.5rem] p-8 text-white shadow-soft">
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">How others see you</p>
          <div className="mt-5 flex items-center gap-4">
            <Avatar config={preview} className="size-20 text-3xl ring-4 ring-white/40" />
            <div>
              <p className="font-display text-3xl">{(mode === "signup" ? name : identity.displayName) || "Your name"}</p>
              {latest && <p className="text-sm opacity-90">{skinTypeLabel(latest.scores)} skin · {twins.length} twins</p>}
            </div>
          </div>
          {latest && (
            <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
              <div className="glass rounded-2xl p-3">
                <p className="text-[10px] uppercase tracking-wider opacity-80">Skin score</p>
                <p className="font-display text-2xl">{latest.overall}/100</p>
              </div>
              <div className="glass rounded-2xl p-3">
                <p className="text-[10px] uppercase tracking-wider opacity-80">Skin twins</p>
                <p className="font-display text-2xl">{twins.length}</p>
              </div>
            </div>
          )}
          <p className="mt-6 flex items-start gap-2 text-xs opacity-90">
            <Lock className="mt-0.5 size-3.5 shrink-0" /> Your scan photos are never shown to anyone. Others only see your name, avatar and the results you choose to share.
          </p>
        </div>
        <ul className="mx-auto mt-6 max-w-sm space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-muted">
              <span className="grid size-5 place-items-center rounded-full bg-blush-100 text-plum">
                <Check className="size-3" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.05 }} className="mx-auto w-full max-w-md">
        <div className="rounded-[2rem] border border-line bg-surface p-8 shadow-soft">
          {sent ? (
            <div className="py-6 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush-100 text-plum">
                <MailCheck className="size-6" />
              </span>
              <h1 className="mt-4 font-display text-2xl">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted">
                We sent a confirmation link to <b className="font-medium text-ink">{email}</b>. Open it, then log in. Your results stay saved on
                this device meanwhile.
              </p>
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-6 inline-block rounded-full bg-plum-deep px-6 py-3 text-sm font-medium text-white">
                Go to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl">{mode === "signup" ? "Save your skin profile" : "Welcome back"}</h1>
              <p className="mt-1 text-sm text-muted">
                {mode === "signup" ? "One step. Free. Your photos stay on your device." : "Log in to pick up where you left off."}
              </p>

              {!enabled && <p className="mt-4 rounded-2xl bg-warn-soft p-3 text-xs text-warn">Accounts aren&apos;t configured on this site. You can keep using it as a guest.</p>}

              <form onSubmit={submit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <label className="block">
                    <span className="text-xs font-medium">Display name</span>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="given-name"
                      className="mt-1 w-full rounded-2xl border border-line bg-blush-50 px-4 py-3 text-sm outline-none transition focus:border-plum focus:bg-surface"
                      placeholder="Your name"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-xs font-medium">Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="mt-1 w-full rounded-2xl border border-line bg-blush-50 px-4 py-3 text-sm outline-none transition focus:border-plum focus:bg-surface"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium">Password</span>
                  <div className="relative mt-1">
                    <input
                      required
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      minLength={6}
                      className="w-full rounded-2xl border border-line bg-blush-50 px-4 py-3 pe-12 text-sm outline-none transition focus:border-plum focus:bg-surface"
                      placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute top-1/2 end-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-plum"
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>
                {error && <p className="rounded-2xl bg-bad-soft p-3 text-xs text-bad">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || !enabled}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-plum-deep py-4 text-sm font-medium text-white transition hover:bg-plum disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {mode === "signup" ? "Create free account" : "Log in"}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
                {mode === "signup" ? (
                  <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-plum">
                    I already have an account
                  </Link>
                ) : (
                  <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-plum">
                    Create an account
                  </Link>
                )}
                <Link href={latest ? "/twins" : "/scan"} className="text-muted hover:text-plum">
                  Continue as guest →
                </Link>
              </div>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-muted">We save your scores, twins and routine to your account. Photos never leave your device.</p>
      </motion.div>
    </div>
  );
}
