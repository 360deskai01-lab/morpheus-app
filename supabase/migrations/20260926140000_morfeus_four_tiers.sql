-- 4 kademe: basic / net / napp / band + plan kolonları + PayTR sipariş RPC

alter table public.morfeus_billing_plans add column if not exists tier text;
alter table public.morfeus_billing_plans add column if not exists period text;
alter table public.morfeus_billing_plans add column if not exists seat_count integer not null default 1;

update public.morfeus_billing_plans
   set is_active = false
 where plan_code in ('monthly', 'annual');

insert into public.morfeus_billing_plans (plan_code, title, amount_kurus, period_days, tier, period, seat_count, is_active)
values
  ('net_monthly', 'Net Aylık', 8990, 30, 'net', 'monthly', 1, true),
  ('net_annual', 'Net Yıllık', 79990, 365, 'net', 'annual', 1, true),
  ('napp_monthly', 'Napp Aylık', 13990, 30, 'napp', 'monthly', 1, true),
  ('napp_annual', 'Napp Yıllık', 119990, 365, 'napp', 'annual', 1, true),
  ('band_monthly', 'Band Aylık', 24990, 30, 'band', 'monthly', 10, true),
  ('band_annual', 'Band Yıllık', 239990, 365, 'band', 'annual', 10, true)
on conflict (plan_code) do update
  set title = excluded.title,
      amount_kurus = excluded.amount_kurus,
      period_days = excluded.period_days,
      tier = excluded.tier,
      period = excluded.period,
      seat_count = excluded.seat_count,
      is_active = true;

create table if not exists public.morfeus_band_members (
  owner_id uuid not null references public.morfeus_profiles (id) on delete cascade,
  member_id uuid not null references public.morfeus_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, member_id)
);

alter table public.morfeus_band_members enable row level security;
drop policy if exists band_members_select on public.morfeus_band_members;
create policy band_members_select on public.morfeus_band_members
  for select to authenticated
  using (owner_id = auth.uid() or member_id = auth.uid());
drop policy if exists band_members_write on public.morfeus_band_members;
create policy band_members_write on public.morfeus_band_members
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
grant select, insert, delete on public.morfeus_band_members to authenticated;

update public.morfeus_profiles
   set membership_tier = 'napp'
 where lower(coalesce(membership_tier, '')) = 'premium';

comment on column public.morfeus_profiles.membership_tier is
  'basic (ücretsiz) | net (web) | napp (web+app) | band (grup) | admin';

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
    if tier not in ('free', 'basic', 'net', 'napp', 'band', 'premium', 'admin') then
      tier := 'basic';
    end if;
    if lower(coalesce(new.email, '')) = 'master@360bct.com' then
      new.is_master_admin := true;
      new.membership_tier := 'admin';
    else
      new.is_master_admin := false;
      if tier in ('net', 'napp', 'band', 'premium', 'admin') then
        tier := 'basic';
      end if;
      new.membership_tier := tier;
      new.premium_until := null;
    end if;
    return new;
  end if;

  new.id := old.id;
  if public.morfeus_is_master_admin()
     or coalesce(current_setting('morfeus.trusted_billing', true), '') = '1' then
    new.membership_tier := lower(coalesce(new.membership_tier, old.membership_tier));
    return new;
  end if;

  new.membership_tier := old.membership_tier;
  new.is_master_admin := old.is_master_admin;
  new.email := old.email;
  new.premium_until := old.premium_until;
  return new;
end;
$fn$;

create or replace function public.morfeus_admin_set_billing_plan(
  p_plan_code text,
  p_amount_kurus integer,
  p_period_days integer,
  p_title text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.morfeus_is_master_admin() then
    raise exception 'not allowed';
  end if;
  if p_plan_code not in (
    'net_monthly', 'net_annual', 'napp_monthly', 'napp_annual', 'band_monthly', 'band_annual',
    'monthly', 'annual'
  ) then
    raise exception 'invalid plan';
  end if;
  if p_amount_kurus is null or p_amount_kurus < 0 then
    raise exception 'invalid amount';
  end if;
  if p_period_days is null or p_period_days < 1 then
    raise exception 'invalid period';
  end if;

  update public.morfeus_billing_plans
     set amount_kurus = p_amount_kurus,
         period_days = p_period_days,
         title = coalesce(nullif(btrim(p_title), ''), title),
         updated_at = now(),
         updated_by = auth.uid()
   where plan_code = p_plan_code;
end;
$fn$;

create or replace function public.morfeus_admin_grant_plan(p_profile_id uuid, p_plan_code text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  days integer;
  next_tier text;
begin
  if not public.morfeus_is_master_admin() then
    raise exception 'not allowed';
  end if;

  select period_days, coalesce(tier, 'napp') into days, next_tier
    from public.morfeus_billing_plans
   where plan_code = p_plan_code and is_active = true;

  if days is null then
    raise exception 'plan not found';
  end if;

  update public.morfeus_profiles
     set membership_tier = next_tier,
         premium_until = now() + make_interval(days => days)
   where id = p_profile_id;
end;
$fn$;

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
  if tier not in ('free', 'basic', 'net', 'napp', 'band', 'premium', 'admin') then
    raise exception 'invalid tier';
  end if;
  if tier = 'premium' then
    tier := 'napp';
  end if;
  update public.morfeus_profiles
     set membership_tier = tier,
         premium_until = case
           when tier in ('net', 'napp', 'band') then coalesce(premium_until, now() + interval '30 days')
           else null
         end
   where id = p_profile_id;
end;
$fn$;

create or replace function public.morfeus_apply_paid_tier(
  p_user_id uuid,
  p_merchant_oid text,
  p_plan_code text,
  p_amount_kurus integer
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  days integer;
  next_tier text;
  already boolean;
begin
  if p_merchant_oid is null or btrim(p_merchant_oid) = '' then
    raise exception 'invalid oid';
  end if;

  select period_days, coalesce(tier, 'napp') into days, next_tier
    from public.morfeus_billing_plans
   where plan_code = p_plan_code and is_active = true;
  if days is null then
    raise exception 'plan not found';
  end if;

  select exists (
    select 1 from public.morfeus_payments
     where merchant_oid = p_merchant_oid and status = 'paid'
  ) into already;
  if already then
    return;
  end if;

  insert into public.morfeus_payments (merchant_oid, user_id, plan_code, amount_kurus, status, paid_at)
  values (p_merchant_oid, p_user_id, p_plan_code, p_amount_kurus, 'paid', now())
  on conflict (merchant_oid) do update
    set status = 'paid',
        paid_at = now(),
        amount_kurus = excluded.amount_kurus
  where public.morfeus_payments.status <> 'paid';

  perform set_config('morfeus.trusted_billing', '1', true);
  update public.morfeus_profiles
     set membership_tier = next_tier,
         premium_until = case
           when lower(coalesce(membership_tier, '')) = next_tier
             then greatest(coalesce(premium_until, now()), now()) + make_interval(days => days)
           else now() + make_interval(days => days)
         end
   where id = p_user_id
     and coalesce(is_master_admin, false) = false
     and lower(coalesce(membership_tier, '')) <> 'admin';
  perform set_config('morfeus.trusted_billing', '', true);
end;
$fn$;

create or replace function public.morfeus_expire_premium()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  n integer;
begin
  if auth.uid() is not null and not public.morfeus_is_master_admin() then
    raise exception 'not allowed';
  end if;
  perform set_config('morfeus.trusted_billing', '1', true);
  update public.morfeus_profiles
     set membership_tier = 'basic',
         premium_until = null
   where lower(coalesce(membership_tier, '')) in ('premium', 'net', 'napp', 'band')
     and premium_until is not null
     and premium_until < now();
  get diagnostics n = row_count;
  perform set_config('morfeus.trusted_billing', '', true);
  return n;
end;
$fn$;

revoke all on function public.morfeus_apply_paid_tier(uuid, text, text, integer) from public;
grant execute on function public.morfeus_apply_paid_tier(uuid, text, text, integer) to service_role;
revoke all on function public.morfeus_expire_premium() from public;
grant execute on function public.morfeus_expire_premium() to authenticated, service_role;
revoke all on function public.morfeus_admin_set_billing_plan(text, integer, integer, text) from public;
grant execute on function public.morfeus_admin_set_billing_plan(text, integer, integer, text) to authenticated;
revoke all on function public.morfeus_admin_grant_plan(uuid, text) from public;
grant execute on function public.morfeus_admin_grant_plan(uuid, text) to authenticated;
revoke all on function public.morfeus_admin_set_tier(uuid, text) from public;
grant execute on function public.morfeus_admin_set_tier(uuid, text) to authenticated;
