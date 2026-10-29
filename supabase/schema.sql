-- SkinTwin community tables. Paste into Supabase -> SQL Editor -> New query -> Run.
-- Anyone can read; only signed-in users can write, and only as themselves.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  product_id text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 500),
  weeks smallint not null default 0,
  scans smallint not null default 0,
  verified boolean not null default false,
  delta jsonb not null default '{}'::jsonb,   -- measured change per concern
  skin jsonb not null default '{}'::jsonb,    -- author's scores, for matching readers to reviewers
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  review_key text not null,                   -- 'r:<review id>' or a sample review key
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);

create table if not exists public.helpful (
  review_key text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_key, user_id)
);

create index if not exists reviews_product_idx on public.reviews (product_id, created_at desc);
create index if not exists comments_review_idx on public.comments (review_key, created_at);

alter table public.reviews enable row level security;
alter table public.comments enable row level security;
alter table public.helpful enable row level security;

drop policy if exists "read reviews" on public.reviews;
drop policy if exists "write own reviews" on public.reviews;
drop policy if exists "delete own reviews" on public.reviews;
create policy "read reviews" on public.reviews for select using (true);
create policy "write own reviews" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own reviews" on public.reviews for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "read comments" on public.comments;
drop policy if exists "write own comments" on public.comments;
drop policy if exists "delete own comments" on public.comments;
create policy "read comments" on public.comments for select using (true);
create policy "write own comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "read helpful" on public.helpful;
drop policy if exists "mark helpful" on public.helpful;
drop policy if exists "unmark helpful" on public.helpful;
create policy "read helpful" on public.helpful for select using (true);
create policy "mark helpful" on public.helpful for insert to authenticated with check (auth.uid() = user_id);
create policy "unmark helpful" on public.helpful for delete to authenticated using (auth.uid() = user_id);

-- Added later: profile photos and shop links. See add-photos-and-links.sql.
alter table public.reviews add column if not exists author_avatar text;
alter table public.reviews add column if not exists buy_url text;
alter table public.reviews add column if not exists buy_affiliate boolean not null default false;
