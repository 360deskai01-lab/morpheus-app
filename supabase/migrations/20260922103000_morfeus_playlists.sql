-- Morpheus repertuvar (playlist) modulu
-- morfeus_playlists ve playlist_songs tablolari kod tarafinda kullaniliyordu
-- fakat veritabaninda hic olusturulmamisti (PostgREST 404).
-- Bu dosya birden fazla kez calistirilabilir (idempotent).

-- gen_random_uuid() icin
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Tablolar
-- ---------------------------------------------------------------------------

create table if not exists public.morfeus_playlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 120),
  song_count  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.playlist_songs (
  id          uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.morfeus_playlists (id) on delete cascade,
  song_id     uuid not null references public.morfeus_songs (id) on delete cascade,
  -- "position" PostgreSQL'de rezerve anahtar kelime oldugu icin sort_order
  sort_order  integer,
  created_at  timestamptz not null default now(),
  -- ayni parcanin ayni listeye iki kez eklenmesini engeller;
  -- istemci bu ihlali "zaten listede" mesajina cevirir
  unique (playlist_id, song_id)
);

create index if not exists morfeus_playlists_user_id_idx
  on public.morfeus_playlists (user_id, created_at desc);

create index if not exists playlist_songs_song_id_idx
  on public.playlist_songs (song_id);

-- Portal bu kolonu okuyup yaziyordu; yoksa ekle.
alter table public.morfeus_songs
  add column if not exists playlist_count integer not null default 0;

-- ---------------------------------------------------------------------------
-- 2. Sayac senkronizasyonu
--    song_count ve playlist_count artik istemcide degil burada tutuluyor.
--    security definer: sayac guncellemesi morfeus_songs uzerinde public
--    UPDATE yetkisi gerektirmesin diye.
-- ---------------------------------------------------------------------------

create or replace function public.morfeus_sync_playlist_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.morfeus_playlists
       set song_count = song_count + 1
     where id = new.playlist_id;

    update public.morfeus_songs
       set playlist_count = playlist_count + 1
     where id = new.song_id;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.morfeus_playlists
       set song_count = greatest(song_count - 1, 0)
     where id = old.playlist_id;

    update public.morfeus_songs
       set playlist_count = greatest(playlist_count - 1, 0)
     where id = old.song_id;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_playlist_songs_counters on public.playlist_songs;

create trigger trg_playlist_songs_counters
  after insert or delete on public.playlist_songs
  for each row execute function public.morfeus_sync_playlist_counters();

-- ---------------------------------------------------------------------------
-- 3. RLS: her kullanici yalnizca kendi repertuvarini gorur ve yonetir
-- ---------------------------------------------------------------------------

alter table public.morfeus_playlists enable row level security;
alter table public.playlist_songs    enable row level security;

drop policy if exists morfeus_playlists_select_own on public.morfeus_playlists;
drop policy if exists morfeus_playlists_insert_own on public.morfeus_playlists;
drop policy if exists morfeus_playlists_update_own on public.morfeus_playlists;
drop policy if exists morfeus_playlists_delete_own on public.morfeus_playlists;

create policy morfeus_playlists_select_own on public.morfeus_playlists
  for select using (auth.uid() = user_id);

create policy morfeus_playlists_insert_own on public.morfeus_playlists
  for insert with check (auth.uid() = user_id);

create policy morfeus_playlists_update_own on public.morfeus_playlists
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy morfeus_playlists_delete_own on public.morfeus_playlists
  for delete using (auth.uid() = user_id);

drop policy if exists playlist_songs_select_own on public.playlist_songs;
drop policy if exists playlist_songs_insert_own on public.playlist_songs;
drop policy if exists playlist_songs_delete_own on public.playlist_songs;

create policy playlist_songs_select_own on public.playlist_songs
  for select using (
    exists (
      select 1 from public.morfeus_playlists p
       where p.id = playlist_songs.playlist_id
         and p.user_id = auth.uid()
    )
  );

create policy playlist_songs_insert_own on public.playlist_songs
  for insert with check (
    exists (
      select 1 from public.morfeus_playlists p
       where p.id = playlist_songs.playlist_id
         and p.user_id = auth.uid()
    )
  );

create policy playlist_songs_delete_own on public.playlist_songs
  for delete using (
    exists (
      select 1 from public.morfeus_playlists p
       where p.id = playlist_songs.playlist_id
         and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Yetkiler
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.morfeus_playlists to authenticated;
grant select, insert, delete          on public.playlist_songs    to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Mevcut kayitlar icin sayaclari bastan hesapla
--    (tablolar yeni ise no-op, tekrar calistirmada drift'i duzeltir)
-- ---------------------------------------------------------------------------

-- left join: hic parcasi olmayan liste / hic listede olmayan parca da sifirlanir
update public.morfeus_playlists p
   set song_count = c.total
  from (
    select p2.id, count(ps.id)::integer as total
      from public.morfeus_playlists p2
      left join public.playlist_songs ps on ps.playlist_id = p2.id
     group by p2.id
  ) c
 where c.id = p.id
   and p.song_count is distinct from c.total;

update public.morfeus_songs s
   set playlist_count = c.total
  from (
    select s2.id, count(ps.id)::integer as total
      from public.morfeus_songs s2
      left join public.playlist_songs ps on ps.song_id = s2.id
     group by s2.id
  ) c
 where c.id = s.id
   and s.playlist_count is distinct from c.total;
