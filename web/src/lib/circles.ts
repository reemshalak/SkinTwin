import { CONCERN_KEYS, skinTypeLabel } from "./concerns";
import { COHORT, FEATURED } from "./cohort";
import { personById } from "./people";
import { productById } from "./products";
import { hashString } from "./random";
import { supabase } from "./supabase";
import { storyOf } from "./twins";
import type { ConcernKey, Scores } from "./types";

// Twin Circles: public spaces for one skin type, where people ask questions
// and share progress (week 1 vs week N, from their own scans).

export const CIRCLES = ["Oily", "Combination", "Dry & sensitive", "Dry", "Sensitive", "Balanced"] as const;
export type Circle = (typeof CIRCLES)[number];

export const circleOf = (scores: Scores) => skinTypeLabel(scores) as Circle;

export const CIRCLE_INFO: Record<Circle, { blurb: string; hue: string }> = {
  Oily: { blurb: "Shine, pores and breakouts", hue: "from-[#EEF6F6] to-[#CBE7E6]" },
  Combination: { blurb: "Oily T-zone, drier cheeks", hue: "from-[#F7F2F6] to-[#E7DDF0]" },
  "Dry & sensitive": { blurb: "Tight, reactive, easily red", hue: "from-[#FFF0F3] to-[#F7C7D2]" },
  Dry: { blurb: "Flaky, dehydrated, needs comfort", hue: "from-[#EEF3F6] to-[#CFE0EA]" },
  Sensitive: { blurb: "Stings, flushes, reacts", hue: "from-[#FBF0E8] to-[#F2D3C2]" },
  Balanced: { blurb: "Keeping good skin good", hue: "from-[#FFF6E5] to-[#F8DDAA]" },
};

export const memberCount = (c: Circle) => COHORT.filter((m) => skinTypeLabel(m.scores) === c).length;

export interface CirclePost {
  key: string; // "sample:c…" sample, "c:<uuid>" real
  circle: Circle;
  kind: "question" | "progress";
  authorName: string;
  authorSeed: string;
  authorAvatar?: string;
  personId?: string;
  userId?: string;
  body: string;
  weeks: number;
  startScore?: number;
  nowScore?: number;
  delta: Partial<Scores>;
  createdAt: string;
}

const QUESTIONS = [
  "Did anyone else purge in the first two weeks on salicylic acid?",
  "What moisturiser do you use under SPF without pilling?",
  "How long did it take before you saw a change in your pores?",
  "Retinol every night or every other night for you?",
  "Anyone found a cleanser that doesn't leave skin tight?",
  "Does niacinamide make anyone else flush a little?",
];
const ANCHOR = Date.UTC(2026, 9, 30);
const avg = (s: Scores) => Math.round(CONCERN_KEYS.reduce((n, k) => n + s[k], 0) / CONCERN_KEYS.length);

// Sample posts from the community profiles, so circles feel alive on day one.
export const SAMPLE_CIRCLE_POSTS: CirclePost[] = FEATURED.flatMap((m, i) => {
  const person = personById(m.personId!)!;
  const circle = circleOf(m.scores);
  const { best, bestNet } = storyOf(m);
  const product = productById(best.productId);
  const h = hashString(m.id);
  const day = (n: number) => new Date(ANCHOR - n * 86_400_000 - (h % 20) * 3_600_000).toISOString();
  const posts: CirclePost[] = [
    { key: `sample:cq:${m.id}`, circle, kind: "question", authorName: person.name, authorSeed: person.id, personId: person.id, body: QUESTIONS[(h + i) % QUESTIONS.length], weeks: 0, delta: {}, createdAt: day(h % 9) },
  ];
  if (product && bestNet > 3) {
    const start = avg(m.scores);
    posts.push({
      key: `sample:cp:${m.id}`,
      circle,
      kind: "progress",
      authorName: person.name,
      authorSeed: person.id,
      personId: person.id,
      body: `Week ${best.weeks} on ${product.name}. ${best.review}`,
      weeks: best.weeks,
      startScore: start,
      nowScore: start + Math.round(bestNet / CONCERN_KEYS.length),
      delta: best.delta,
      createdAt: day((h % 12) + 1),
    });
  }
  return posts;
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

interface Row {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  circle: Circle;
  kind: "question" | "progress";
  body: string;
  weeks: number;
  start_score: number | null;
  now_score: number | null;
  delta: Partial<Record<ConcernKey, number>>;
  created_at: string;
}

const toPost = (r: Row): CirclePost => ({
  key: `c:${r.id}`,
  circle: r.circle,
  kind: r.kind,
  authorName: r.author_name,
  authorSeed: r.user_id,
  authorAvatar: r.author_avatar ?? undefined,
  userId: r.user_id,
  body: r.body,
  weeks: r.weeks,
  startScore: r.start_score ?? undefined,
  nowScore: r.now_score ?? undefined,
  delta: r.delta ?? {},
  createdAt: r.created_at,
});

export async function fetchCirclePosts(circle: Circle): Promise<CirclePost[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("circle_posts").select("*").eq("circle", circle).order("created_at", { ascending: false }).limit(50);
  return error || !data ? [] : (data as Row[]).map(toPost);
}

export async function postToCircle(input: Omit<CirclePost, "key" | "authorSeed" | "createdAt" | "userId" | "personId">): Promise<{ error?: string; post?: CirclePost }> {
  if (!supabase) return { error: "Accounts aren't set up on this site." };
  const { data, error } = await supabase
    .from("circle_posts")
    .insert({
      author_name: input.authorName,
      author_avatar: input.authorAvatar ?? null,
      circle: input.circle,
      kind: input.kind,
      body: input.body,
      weeks: input.weeks,
      start_score: input.startScore ?? null,
      now_score: input.nowScore ?? null,
      delta: input.delta,
    })
    .select()
    .single();
  if (error) return { error: error.message.includes("does not exist") ? "Circles aren't set up yet (run supabase/add-circles.sql)." : error.message };
  return { post: toPost(data as Row) };
}

export async function deleteCirclePost(key: string) {
  if (!supabase || !key.startsWith("c:")) return;
  await supabase.from("circle_posts").delete().eq("id", key.slice(2));
}
