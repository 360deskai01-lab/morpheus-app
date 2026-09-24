-- Temel tablolar: sonraki migration'lar morfeus_songs / morfeus_profiles'a
-- FK ve ALTER uygular. Canli DB'de tablolar zaten varsa no-op.

create extension if not exists pgcrypto;

create table if not exists public.morfeus_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  membership_tier text not null default 'BASIC',
  is_master_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.morfeus_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.morfeus_profiles (id) on delete set null,
  title text not null,
  artist text not null,
  original_key text,
  bpm integer,
  capo text,
  content text,
  genre text,
  release_year integer,
  origin text,
  is_local boolean,
  rating numeric,
  votes_count integer default 0,
  views integer default 0,
  rating_avg numeric,
  rating_count integer default 0,
  view_count integer default 0,
  created_at timestamptz default now()
);

alter table public.morfeus_profiles enable row level security;
alter table public.morfeus_songs enable row level security;

drop policy if exists morfeus_profiles_select on public.morfeus_profiles;
create policy morfeus_profiles_select on public.morfeus_profiles
  for select using (true);

drop policy if exists morfeus_profiles_update_own on public.morfeus_profiles;
create policy morfeus_profiles_update_own on public.morfeus_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists morfeus_profiles_insert_own on public.morfeus_profiles;
create policy morfeus_profiles_insert_own on public.morfeus_profiles
  for insert with check (auth.uid() = id);

drop policy if exists morfeus_songs_select on public.morfeus_songs;
create policy morfeus_songs_select on public.morfeus_songs
  for select using (true);

drop policy if exists morfeus_songs_write_auth on public.morfeus_songs;
create policy morfeus_songs_write_auth on public.morfeus_songs
  for insert to authenticated with check (true);

drop policy if exists morfeus_songs_update_auth on public.morfeus_songs;
create policy morfeus_songs_update_auth on public.morfeus_songs
  for update to authenticated using (true) with check (true);

grant select on public.morfeus_profiles to anon, authenticated;
grant insert, update on public.morfeus_profiles to authenticated;
grant select on public.morfeus_songs to anon, authenticated;
grant insert, update, delete on public.morfeus_songs to authenticated;
