-- Private saved profile: scans (no selfies), routine, goal, journal, settings.
-- One row per account, readable and writable only by its owner. Safe to run twice.

create table if not exists public.user_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 2000000),
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "read own state" on public.user_state;
drop policy if exists "insert own state" on public.user_state;
drop policy if exists "update own state" on public.user_state;
drop policy if exists "delete own state" on public.user_state;
create policy "read own state" on public.user_state for select to authenticated using (auth.uid() = user_id);
create policy "insert own state" on public.user_state for insert to authenticated with check (auth.uid() = user_id);
create policy "update own state" on public.user_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own state" on public.user_state for delete to authenticated using (auth.uid() = user_id);
