"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BookHeart, ScanFace, ShoppingBag, Users } from "lucide-react";
import { Page } from "../Page";
import { EASE } from "../motion";
import { useAuth } from "@/lib/auth";

// Home for a signed-in person with no scan on this device yet: their account, not the sales pitch.
export function Welcome() {
  const { name } = useAuth();
  const first = name?.trim().split(/\s+/)[0];
  return (
    <Page>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASE }}>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">Your account</p>
        <h1 className="mt-1 font-display text-4xl text-ink lg:text-5xl">{first ? `Welcome, ${first}` : "Welcome to SkinTwin"}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">Your account is ready. One 10-second scan maps your skin and finds people whose skin measures like yours.</p>
      </motion.div>

      <Link href="/scan" className="glow-card group mt-8 flex flex-col gap-5 rounded-[2rem] p-7 text-white shadow-soft sm:flex-row sm:items-center">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-white/15">
          <ScanFace className="size-8" />
        </span>
        <span className="flex-1">
          <span className="block font-display text-3xl">Take your first scan</span>
          <span className="mt-1 block text-sm text-white/85">Eight skin scores from one selfie. It becomes week 1 in your journal, so every check-in after it shows what changed.</span>
        </span>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-6 py-3 text-sm font-medium text-[#5a2a43] sm:self-center">
          Scan my skin <ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:-scale-x-100" />
        </span>
      </Link>

      <p className="mt-10 text-sm font-medium">While you&apos;re here</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/twins", icon: Users, title: "Meet the community", body: "See scan-verified results from people of every skin type." },
          { href: "/shop", icon: ShoppingBag, title: "Browse products", body: "Every product shows how it went, split by skin type." },
          { href: "/journal", icon: BookHeart, title: "Your skin journal", body: "Your weekly check-ins fill this book, page by page." },
        ].map(({ href, icon: Icon, title, body }) => (
          <li key={href}>
            <Link href={href} className="flex h-full items-start gap-3 rounded-[1.5rem] border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-card">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-100 text-plum">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="mt-0.5 block text-xs text-muted">{body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

// Shown for a moment while a signed-in account's saved scans load.
export function HomeLoading() {
  return (
    <Page>
      <div aria-busy="true" aria-label="Loading your account" className="animate-pulse">
        <div className="h-4 w-32 rounded-full bg-blush-100" />
        <div className="mt-3 h-10 w-72 max-w-full rounded-full bg-blush-100" />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-64 rounded-[2rem] bg-blush-100" />
          <div className="h-64 rounded-[2rem] bg-blush-100/70" />
        </div>
      </div>
    </Page>
  );
}
