-- RLS + yetki sertlestirme (canli SQL Editor ile de calisir)

create or replace function public.morfeus_is_master_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.morfeus_profiles p
    where p.id = auth.uid()
      and (
        p.is_master_admin = true
        or lower(coalesce(p.email, '')) = 'master@360bct.com'
        or lower(coalesce(p.membership_tier, '')) = 'admin'
      )
  );
$fn$;

revoke all on function public.morfeus_is_master_admin() from public;
grant execute on function public.morfeus_is_master_admin() to authenticated;

create or replace function public.morfeus_guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  tier text;
begin
  if tg_op = 'INSERT' then
    tier := lower(coalesce(nullif(btrim(new.membership_tier), ''), 'basic'));
    if tier not in ('free', 'basic', 'premium', 'admin') then
      tier := 'basic';
    end if;
    if lower(coalesce(new.email, '')) = 'master@360bct.com' then
      new.is_master_admin := true;
      new.membership_tier := 'admin';
    else
      new.is_master_admin := false;
      if tier in ('premium', 'admin') then
        tier := 'basic';
      end if;
      new.membership_tier := tier;
    end if;
    return new;
  end if;

  new.id := old.id;
  if public.morfeus_is_master_admin() then
    new.membership_tier := lower(coalesce(new.membership_tier, old.membership_tier));
    return new;
  end if;

  new.membership_tier := old.membership_tier;
  new.is_master_admin := old.is_master_admin;
  new.email := old.email;
  return new;
end;
$fn$;

drop trigger if exists trg_morfeus_guard_profile on public.morfeus_profiles;
create trigger trg_morfeus_guard_profile
  before insert or update on public.morfeus_profiles
  for each row execute procedure public.morfeus_guard_profile_columns();

revoke select on public.morfeus_profiles from anon;
grant select (
  id, full_name, membership_tier, is_master_admin,
  avatar_url, stage_badge, chord_palette, created_at
) on public.morfeus_profiles to anon;

drop policy if exists morfeus_songs_update_auth on public.morfeus_songs;
drop policy if exists morfeus_songs_update_owner on public.morfeus_songs;
drop policy if exists morfeus_songs_delete_admin on public.morfeus_songs;

create policy morfeus_songs_update_owner on public.morfeus_songs
  for update to authenticated
  using (user_id = auth.uid() or public.morfeus_is_master_admin())
  with check (user_id = auth.uid() or public.morfeus_is_master_admin());

create policy morfeus_songs_delete_admin on public.morfeus_songs
  for delete to authenticated
  using (public.morfeus_is_master_admin());

create or replace function public.morfeus_bump_song_views(p_song_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.morfeus_songs
     set views = coalesce(views, 0) + 1,
         view_count = coalesce(view_count, 0) + 1
   where id = p_song_id;
end;
$fn$;

revoke all on function public.morfeus_bump_song_views(uuid) from public;
grant execute on function public.morfeus_bump_song_views(uuid) to anon, authenticated;

create or replace function public.morfeus_rate_song(p_song_id uuid, p_stars integer)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  rec record;
  next_votes integer;
  new_avg numeric;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;
  if p_stars is null or p_stars < 1 or p_stars > 5 then
    raise exception 'invalid rating';
  end if;

  select * into rec from public.morfeus_songs where id = p_song_id for update;
  if not found then
    raise exception 'song not found';
  end if;

  next_votes := coalesce(nullif(rec.votes_count, 0), rec.rating_count, 0) + 1;
  new_avg := round(
    ((coalesce(rec.rating, rec.rating_avg, 5) * (next_votes - 1) + p_stars) / next_votes)::numeric,
    1
  );

  update public.morfeus_songs
     set rating = new_avg,
         rating_avg = new_avg,
         votes_count = next_votes,
         rating_count = next_votes
   where id = p_song_id;

  return json_build_object('rating', new_avg, 'votes', next_votes);
end;
$fn$;

revoke all on function public.morfeus_rate_song(uuid, integer) from public;
grant execute on function public.morfeus_rate_song(uuid, integer) to authenticated;

create or replace function public.morfeus_admin_set_tier(p_profile_id uuid, p_tier text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  tier text;
begin
  if not public.morfeus_is_master_admin() then
    raise exception 'not allowed';
  end if;
  tier := lower(btrim(coalesce(p_tier, 'basic')));
  if tier not in ('free', 'basic', 'premium', 'admin') then
    raise exception 'invalid tier';
  end if;
  update public.morfeus_profiles
     set membership_tier = tier
   where id = p_profile_id;
end;
$fn$;

revoke all on function public.morfeus_admin_set_tier(uuid, text) from public;
grant execute on function public.morfeus_admin_set_tier(uuid, text) to authenticated;

create or replace function public.morfeus_admin_delete_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.morfeus_is_master_admin() then
    raise exception 'not allowed';
  end if;
  if p_profile_id = auth.uid() then
    raise exception 'cannot delete self';
  end if;
  delete from public.morfeus_profiles where id = p_profile_id;
end;
$fn$;

revoke all on function public.morfeus_admin_delete_profile(uuid) from public;
grant execute on function public.morfeus_admin_delete_profile(uuid) to authenticated;
