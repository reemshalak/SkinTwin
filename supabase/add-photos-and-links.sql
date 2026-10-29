-- Profile photos and "where I bought it" links on reviews.
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run twice.

alter table public.reviews add column if not exists author_avatar text;
alter table public.reviews add column if not exists buy_url text;
alter table public.reviews add column if not exists buy_affiliate boolean not null default false;

-- Small images only (the app sends a ~10 KB 192px JPEG).
alter table public.reviews drop constraint if exists reviews_avatar_size;
alter table public.reviews add constraint reviews_avatar_size
  check (author_avatar is null or (author_avatar like 'data:image/%' and char_length(author_avatar) <= 60000));

-- Shop links: https only, and only on scan-verified reviews.
alter table public.reviews drop constraint if exists reviews_buy_url_rules;
alter table public.reviews add constraint reviews_buy_url_rules
  check (buy_url is null or (verified and buy_url like 'https://%' and char_length(buy_url) <= 500));
