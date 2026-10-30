"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, HelpCircle, Loader2, MessageCircle, Send, ThumbsUp, TrendingUp, Users } from "lucide-react";
import { Avatar, avatarFromSeed } from "@/components/Avatar";
import { EASE } from "@/components/motion";
import { useMyIdentity } from "@/components/MyAvatar";
import { NeedScan } from "@/components/NeedScan";
import { Page } from "@/components/Page";
import { Delta } from "@/components/ui";
import { WriteOn } from "@/components/WriteOn";
import { useAuth } from "@/lib/auth";
import { CIRCLE_INFO, CIRCLES, circleOf, fetchCirclePosts, memberCount, postToCircle, SAMPLE_CIRCLE_POSTS, type Circle, type CirclePost } from "@/lib/circles";
import { fetchComments, postComment, sampleComments, type Comment, type ReviewPost } from "@/lib/community";
import { CONCERNS } from "@/lib/concerns";
import { useStore } from "@/lib/store";
import type { ConcernKey } from "@/lib/types";
import { useEngagement } from "@/lib/use-engagement";

const DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const WEEK = 7 * 86_400_000;

export default function CirclesPage() {
  const { ready, latest, scans } = useStore();
  const auth = useAuth();
  const mine = latest ? circleOf(latest.scores) : null;
  const [circle, setCircle] = useState<Circle | null>(null);
  const [real, setReal] = useState<CirclePost[]>([]);
  const [filter, setFilter] = useState<"all" | "question" | "progress">("all");
  const active = circle ?? mine ?? "Oily";

  useEffect(() => {
    fetchCirclePosts(active).then(setReal);
  }, [active]);

  const posts = useMemo(
    () => [...real, ...SAMPLE_CIRCLE_POSTS.filter((p) => p.circle === active)].filter((p) => filter === "all" || p.kind === filter),
    [real, active, filter],
  );
  const engagement = useEngagement(posts.map((p) => p.key));

  if (!ready) return null;
  if (!latest) return <NeedScan what="your Twin Circle" />;

  const order = [mine!, ...CIRCLES.filter((c) => c !== mine)];

  return (
    <Page className="!max-w-4xl">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-plum">Twin Circles</p>
      <h1 className="mt-1 font-display text-3xl text-ink lg:text-4xl">
        <WriteOn text="Ask people with your skin." mark="your" />
      </h1>
      <p className="mt-1 text-sm text-muted">Questions and progress from people whose skin measures like yours. Everything here is public; scan photos never are.</p>

      {/* Circle chips */}
      <ul className="-mx-5 mt-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
        {order.map((c) => {
          const on = c === active;
          return (
            <li key={c} className="shrink-0 snap-start">
              <button
                onClick={() => setCircle(c)}
                aria-pressed={on}
                className={`flex w-40 flex-col rounded-[1.5rem] bg-gradient-to-br p-4 text-left text-[#3a2430] transition ${CIRCLE_INFO[c].hue} ${on ? "ring-2 ring-plum ring-offset-2 ring-offset-blush-50" : "hover:-translate-y-0.5"}`}
              >
                {c === mine && <span className="mb-1 w-fit rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#7a3f5c]">Your circle</span>}
                <span className="font-display text-lg leading-tight">{c}</span>
                <span className="text-[10px] opacity-75">{CIRCLE_INFO[c].blurb}</span>
                <span className="mt-2 flex items-center gap-1 text-[10px] opacity-80"><Users className="size-3" /> {memberCount(c).toLocaleString()} members</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Composer */}
      {active === mine ? (
        auth.user ? (
          <Composer circle={active} onPosted={(p) => setReal((r) => [p, ...r])} />
        ) : (
          <Link href="/signup?next=/circles" className="mt-5 flex items-center justify-between rounded-[1.75rem] border border-line bg-surface p-4 text-sm hover:shadow-card">
            <span><b className="font-medium">Join the conversation.</b> <span className="text-muted">A free account lets you ask and share progress.</span></span>
            <ArrowRight className="size-4 text-plum" />
          </Link>
        )
      ) : (
        <p className="mt-5 rounded-[1.75rem] bg-blush-100 p-4 text-xs text-muted">You can read any circle. Posting is in your own circle, so answers come from people with your skin.</p>
      )}

      {/* Filter */}
      <div role="tablist" aria-label="Post type" className="mt-6 inline-flex rounded-full bg-blush-100 p-1 text-sm">
        {(
          [
            ["all", "Everything"],
            ["question", "Questions"],
            ["progress", "Progress"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)} className={`relative rounded-full px-4 py-1.5 transition ${filter === id ? "text-plum" : "text-muted"}`}>
            {filter === id && <motion.span layoutId="circle-filter" className="absolute inset-0 rounded-full bg-surface shadow-card" />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {posts.map((p, i) => (
          <motion.li key={p.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04, ease: EASE }}>
            <CircleCard post={p} helpful={engagement.get(p.key)} onHelpful={() => engagement.toggle(p.key)} />
          </motion.li>
        ))}
        {!posts.length && <li className="rounded-[1.75rem] border border-dashed border-blush-300 p-8 text-center text-sm text-muted">Nothing here yet. Be the first to post.</li>}
      </ul>

      {scans.length < 2 && active === mine && (
        <p className="mt-6 text-center text-xs text-muted">
          Check in again next week and you can share your own week-by-week progress here. <Link href="/scan" className="text-plum underline">Check in</Link>
        </p>
      )}
    </Page>
  );
}

// Ask a question, or share progress filled in from your own scans.
function Composer({ circle, onPosted }: { circle: Circle; onPosted: (p: CirclePost) => void }) {
  const { scans } = useStore();
  const me = useMyIdentity();
  const [kind, setKind] = useState<"question" | "progress">("question");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = scans[0];
  const last = scans[scans.length - 1];
  const canProgress = scans.length > 1;
  const weeks = canProgress ? Math.max(1, Math.round((new Date(last.capturedAt).getTime() - new Date(first.capturedAt).getTime()) / WEEK)) : 0;
  const delta = canProgress
    ? (Object.fromEntries((Object.keys(CONCERNS) as ConcernKey[]).map((k) => [k, last.scores[k] - first.scores[k]]).filter(([, v]) => Math.abs(v as number) >= 2)) as Partial<Record<ConcernKey, number>>)
    : {};

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return setError(kind === "question" ? "Write your question first." : "Add a line about how it's going.");
    setBusy(true);
    setError(null);
    const res = await postToCircle({
      circle,
      kind,
      authorName: me.name || "SkinTwin member",
      authorAvatar: me.avatar.photo,
      body: body.trim(),
      weeks: kind === "progress" ? weeks : 0,
      startScore: kind === "progress" ? first.overall : undefined,
      nowScore: kind === "progress" ? last.overall : undefined,
      delta: kind === "progress" ? delta : {},
    });
    setBusy(false);
    if (res.error) return setError(res.error);
    setBody("");
    onPosted(res.post!);
  }

  return (
    <form onSubmit={submit} className="mt-5 rounded-[1.75rem] border border-line bg-surface p-4">
      <div className="flex gap-2">
        {(
          [
            ["question", "Ask a question", HelpCircle],
            ["progress", "Share my progress", TrendingUp],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            disabled={id === "progress" && !canProgress}
            aria-pressed={kind === id}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs transition disabled:opacity-40 ${kind === id ? "bg-plum-deep text-white" : "border border-line text-muted"}`}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>
      {kind === "progress" && canProgress && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-blush-50 p-3 text-xs">
          <span className="font-medium">Week 1 → week {weeks + 1}</span>
          <span className="text-muted">· {first.overall} → {last.overall}</span>
          {(Object.entries(delta) as [ConcernKey, number][]).slice(0, 3).map(([k, v]) => (
            <span key={k} className="rounded-full bg-surface px-2 py-0.5">{CONCERNS[k].label} <Delta value={v} /></span>
          ))}
          <span className="w-full text-[10px] text-muted">Filled in from your own scans. Photos are never shared.</span>
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={600}
        rows={2}
        placeholder={kind === "question" ? "e.g. Did anyone purge on salicylic acid?" : "e.g. Pores look smaller, a bit dry around the nose."}
        className="mt-3 w-full resize-none rounded-2xl border border-line bg-blush-50 px-4 py-3 text-sm outline-none focus:border-plum focus:bg-surface"
      />
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
      <div className="mt-2 flex justify-end">
        <button disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-plum-deep px-5 py-2.5 text-sm text-white disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Post to {circle}
        </button>
      </div>
    </form>
  );
}

function CircleCard({ post, helpful, onHelpful }: { post: CirclePost; helpful: { count: number; mine: boolean }; onHelpful: () => void }) {
  const auth = useAuth();
  const me = useMyIdentity();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const sampleLike = { key: post.key, createdAt: post.createdAt } as ReviewPost;
  const replyCount = comments ? comments.length : post.key.startsWith("sample:") ? sampleComments(sampleLike).length : 0;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      const real = await fetchComments([post.key]);
      setComments([...(post.key.startsWith("sample:") ? sampleComments(sampleLike) : []), ...real]);
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    const res = await postComment(post.key, me.name || "SkinTwin member", draft.trim());
    setBusy(false);
    if (res.comment) {
      setComments((c) => [...(c ?? []), res.comment!]);
      setDraft("");
    }
  }

  const author = (
    <>
      <Avatar config={avatarFromSeed(post.authorSeed, post.authorName, post.authorAvatar)} className="size-9 text-sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{post.authorName}</span>
        <span className="text-[11px] text-muted">{DATE.format(new Date(post.createdAt))}</span>
      </span>
    </>
  );

  return (
    <article className="rounded-[1.75rem] border border-line bg-surface p-4">
      <header className="flex items-center justify-between gap-3">
        {post.personId ? <Link href={`/twins/${post.personId}`} className="flex min-w-0 items-center gap-2.5">{author}</Link> : <span className="flex min-w-0 items-center gap-2.5">{author}</span>}
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${post.kind === "question" ? "bg-blush-100 text-plum" : "bg-good-soft text-good"}`}>
          {post.kind === "question" ? <HelpCircle className="size-3.5" /> : <TrendingUp className="size-3.5" />}
          {post.kind === "question" ? "Question" : `Progress · week ${post.weeks}`}
        </span>
      </header>

      {post.kind === "progress" && post.startScore !== undefined && post.nowScore !== undefined && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-blush-50 p-3">
          <span className="text-center">
            <span className="block font-display text-2xl text-muted">{post.startScore}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted">Week 1</span>
          </span>
          <ArrowRight className="size-4 text-plum" />
          <span className="text-center">
            <span className="block font-display text-2xl text-ink">{post.nowScore}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted">Week {post.weeks}</span>
          </span>
          <span className="ms-auto flex flex-wrap justify-end gap-1.5">
            {(Object.entries(post.delta) as [ConcernKey, number][])
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .slice(0, 3)
              .map(([k, v]) => (
                <span key={k} className="rounded-full bg-surface px-2 py-0.5 text-[10px]">{CONCERNS[k].label} <Delta value={v} /></span>
              ))}
          </span>
        </div>
      )}

      <p className={`mt-3 leading-relaxed ${post.kind === "question" ? "font-display text-lg text-ink" : "text-sm"}`}>{post.body}</p>

      <footer className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs">
        <button onClick={onHelpful} aria-pressed={helpful.mine} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${helpful.mine ? "bg-plum-soft text-plum" : "text-muted hover:bg-blush-100 hover:text-plum"}`}>
          <ThumbsUp className={`size-3.5 ${helpful.mine ? "fill-current" : ""}`} /> {post.kind === "question" ? "Me too" : "Helpful"} · {helpful.count}
        </button>
        <button onClick={toggle} aria-expanded={open} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted hover:bg-blush-100 hover:text-plum">
          <MessageCircle className="size-3.5" /> {replyCount} {post.kind === "question" ? (replyCount === 1 ? "answer" : "answers") : replyCount === 1 ? "reply" : "replies"}
        </button>
      </footer>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="mt-3 space-y-2">
              {comments === null && <li className="flex justify-center py-2 text-muted"><Loader2 className="size-4 animate-spin" /></li>}
              {comments?.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <Avatar config={avatarFromSeed(c.user_id, c.author_name)} className="size-7 text-xs" />
                  <p className="rounded-2xl bg-blush-50 px-3 py-2 text-xs leading-relaxed"><b className="font-medium">{c.author_name}</b> {c.body}</p>
                </li>
              ))}
            </ul>
            {auth.user ? (
              <form onSubmit={send} className="mt-3 flex items-center gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={300} placeholder={post.kind === "question" ? "Share what worked for you…" : "Say something kind…"} aria-label="Write a reply" className="flex-1 rounded-full border border-line bg-blush-50 px-4 py-2 text-xs outline-none focus:border-plum" />
                <button disabled={busy || !draft.trim()} aria-label="Send reply" className="grid size-8 place-items-center rounded-full bg-plum-deep text-white disabled:opacity-50">
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-xs text-muted"><Link href="/login?next=/circles" className="text-plum underline">Log in</Link> to reply.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
