-- Twin Circles: public posts inside skin-type circles (questions and progress).
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run twice.
-- Replies and "helpful" reuse the existing comments and helpful tables (key 'c:<post id>').

create table if not exists public.circle_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  author_avatar text check (author_avatar is null or (author_avatar like 'data:image/%' and char_length(author_avatar) <= 60000)),
  circle text not null check (char_length(circle) between 1 and 40),
  kind text not null check (kind in ('question', 'progress')),
  body text not null check (char_length(body) between 1 and 600),
  weeks smallint not null default 0,
  start_score smallint,
  now_score smallint,
  delta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists circle_posts_circle_idx on public.circle_posts (circle, created_at desc);
alter table public.circle_posts enable row level security;

drop policy if exists "read circle posts" on public.circle_posts;
drop policy if exists "write own circle posts" on public.circle_posts;
drop policy if exists "delete own circle posts" on public.circle_posts;
create policy "read circle posts" on public.circle_posts for select using (true);
create policy "write own circle posts" on public.circle_posts for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own circle posts" on public.circle_posts for delete to authenticated using (auth.uid() = user_id);
