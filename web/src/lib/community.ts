import { FEATURED, trialVerdict } from "./cohort";
import { personById } from "./people";
import { canonicalId, idsOf } from "./products";
import { hashString } from "./random";
import { supabase } from "./supabase";
import type { ConcernKey, Scores } from "./types";

// One review post, whether from the sample community or a real user.
export interface ReviewPost {
  key: string; // "sample:<member>:<product>" or "r:<uuid>"
  authorName: string;
  authorSeed: string; // avatar colour
  personId?: string; // links to a community profile
  userId?: string;
  productId: string;
  rating: number;
  body: string;
  weeks: number;
  scans: number;
  verified: boolean;
  delta: Partial<Scores>;
  skin?: Scores;
  createdAt: string;
  authorAvatar?: string; // profile photo the author picked, never a scan
  buyUrl?: string; // "where I bought it", verified reviews only
  buyAffiliate?: boolean; // the author may earn from the link
}

export interface Comment {
  id: string;
  review_key: string;
  author_name: string;
  user_id: string;
  body: string;
  created_at: string;
}

// Sample posts: every featured member's measured trials, dated over the last few weeks.
const ANCHOR = Date.UTC(2026, 9, 29);
export const SAMPLE_POSTS: ReviewPost[] = FEATURED.flatMap((m) =>
  m.trials.map((t) => {
    const key = `sample:${m.id}:${t.productId}`;
    return {
      key,
      authorName: personById(m.personId!)!.name,
      authorSeed: m.personId!,
      personId: m.personId,
      productId: t.productId,
      rating: t.rating,
      body: t.review,
      weeks: t.weeks,
      scans: Math.max(2, Math.round(t.weeks / 2)),
      verified: true,
      delta: t.delta,
      skin: m.scores,
      createdAt: new Date(ANCHOR - (hashString(key) % 40) * 86_400_000).toISOString(),
      // Some creators link where they bought it; the demo points at the product page.
      ...(trialVerdict(t.delta) === "worked" && hashString(key) % 3 === 0 ? { buyUrl: `/product/${t.productId}`, buyAffiliate: true } : {}),
    };
  }),
).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// Sample engagement so threads feel alive before real users join.
export function sampleHelpful(key: string) {
  return 3 + (hashString(key) % 40);
}
const SAMPLE_REPLIES = [
  "Did you get any purging in the first couple of weeks?",
  "Same skin type here, adding this to my plan.",
  "How often did you use it?",
  "This matches my results almost exactly.",
  "Thanks for sharing the numbers, so helpful.",
];
export function sampleComments(post: ReviewPost): Comment[] {
  const n = hashString(post.key) % 3;
  const names = ["Noor", "Sam", "Ines", "Kai", "Tara"];
  return Array.from({ length: n }, (_, i) => {
    const h = hashString(post.key + i);
    return {
      id: `${post.key}:c${i}`,
      review_key: post.key,
      author_name: names[h % names.length],
      user_id: `sample-${h % names.length}`,
      body: SAMPLE_REPLIES[h % SAMPLE_REPLIES.length],
      created_at: post.createdAt,
    };
  });
}

// ---- Real community (Supabase). Every call degrades to "nothing" if the
// project or tables aren't set up, so the app never breaks.

interface ReviewRow {
  id: string;
  user_id: string;
  author_name: string;
  product_id: string;
  rating: number;
  body: string;
  weeks: number;
  scans: number;
  verified: boolean;
  delta: Partial<Scores>;
  skin: Scores;
  created_at: string;
  author_avatar?: string | null;
  buy_url?: string | null;
  buy_affiliate?: boolean | null;
}

const toPost = (r: ReviewRow): ReviewPost => ({
  key: `r:${r.id}`,
  authorName: r.author_name,
  authorSeed: r.user_id,
  userId: r.user_id,
  productId: canonicalId(r.product_id),
  rating: r.rating,
  body: r.body,
  weeks: r.weeks,
  scans: r.scans,
  verified: r.verified,
  delta: r.delta ?? {},
  skin: r.skin,
  createdAt: r.created_at,
  authorAvatar: r.author_avatar ?? undefined,
  buyUrl: r.verified && r.buy_url ? (cleanBuyUrl(r.buy_url) ?? undefined) : undefined,
  buyAffiliate: Boolean(r.buy_affiliate),
});

// Only plain https links to a public site.
export function cleanBuyUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" && !u.username && u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function fetchReviews(opts: { productId?: string; userId?: string; limit?: number } = {}): Promise<ReviewPost[]> {
  if (!supabase) return [];
  let q = supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 50);
  if (opts.productId) q = q.in("product_id", idsOf(opts.productId));
  if (opts.userId) q = q.eq("user_id", opts.userId);
  const { data, error } = await q;
  return error || !data ? [] : (data as ReviewRow[]).map(toPost);
}

export async function postReview(input: {
  authorName: string;
  productId: string;
  rating: number;
  body: string;
  weeks: number;
  scans: number;
  verified: boolean;
  delta: Partial<Record<ConcernKey, number>>;
  skin: Scores;
  authorAvatar?: string;
  buyUrl?: string;
  buyAffiliate?: boolean;
}): Promise<{ error?: string }> {
  if (!supabase) return { error: "Accounts aren't set up on this site." };
  const extras = {
    author_avatar: input.authorAvatar ?? null,
    buy_url: input.verified ? (input.buyUrl ?? null) : null,
    buy_affiliate: input.verified && Boolean(input.buyUrl) && Boolean(input.buyAffiliate),
  };
  const row = {
    author_name: input.authorName,
    product_id: input.productId,
    rating: input.rating,
    body: input.body,
    weeks: input.weeks,
    scans: input.scans,
    verified: input.verified,
    delta: input.delta,
    skin: input.skin,
  };
  let { error } = await supabase.from("reviews").insert({ ...row, ...extras });
  // Databases set up before photos and links existed: post without them.
  if (error && /author_avatar|buy_url|buy_affiliate/.test(error.message)) ({ error } = await supabase.from("reviews").insert(row));
  if (error?.code === "42P01" || error?.message.includes("does not exist")) return { error: "Community tables aren't set up yet." };
  return error ? { error: error.message } : {};
}

export async function deleteReview(key: string) {
  if (!supabase || !key.startsWith("r:")) return;
  await supabase.from("reviews").delete().eq("id", key.slice(2));
}

export async function fetchComments(keys: string[]): Promise<Comment[]> {
  if (!supabase || !keys.length) return [];
  const { data, error } = await supabase.from("comments").select("*").in("review_key", keys).order("created_at");
  return error || !data ? [] : (data as Comment[]);
}

export async function postComment(reviewKey: string, authorName: string, body: string): Promise<{ error?: string; comment?: Comment }> {
  if (!supabase) return { error: "Accounts aren't set up on this site." };
  const { data, error } = await supabase.from("comments").insert({ review_key: reviewKey, author_name: authorName, body }).select().single();
  if (error) return { error: error.message.includes("does not exist") ? "Community tables aren't set up yet." : error.message };
  return { comment: data as Comment };
}

export async function fetchHelpful(keys: string[]): Promise<{ counts: Record<string, number>; mine: Set<string> }> {
  const counts: Record<string, number> = {};
  const mine = new Set<string>();
  if (!supabase || !keys.length) return { counts, mine };
  const [{ data }, { data: session }] = await Promise.all([supabase.from("helpful").select("review_key,user_id").in("review_key", keys), supabase.auth.getSession()]);
  const uid = session.session?.user.id;
  for (const r of (data as { review_key: string; user_id: string }[] | null) ?? []) {
    counts[r.review_key] = (counts[r.review_key] ?? 0) + 1;
    if (r.user_id === uid) mine.add(r.review_key);
  }
  return { counts, mine };
}

export async function setHelpful(key: string, on: boolean) {
  if (!supabase) return;
  if (on) await supabase.from("helpful").insert({ review_key: key });
  else {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) await supabase.from("helpful").delete().eq("review_key", key).eq("user_id", uid);
  }
}
