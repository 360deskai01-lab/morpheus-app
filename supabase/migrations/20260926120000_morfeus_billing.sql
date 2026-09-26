-- Faturalama: plan fiyatları, sipariş defteri, süre, admin / ödeme RPC

alter table public.morfeus_profiles
  add column if not exists premium_until timestamptz;

create table if not exists public.morfeus_billing_plans (
  plan_code text primary key,
  title text not null,
  amount_kurus integer not null check (amount_kurus >= 0),
  period_days integer not null check (period_days > 0),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.morfeus_profiles (id) on delete set null
);

insert into public.morfeus_billing_plans (plan_code, title, amount_kurus, period_days)
values
  ('monthly', 'Aylık', 11900, 30),
  ('annual', 'Yıllık', 82800, 365)
on conflict (plan_code) do nothing;

create table if not exists public.morfeus_payments (
  id uuid primary key default gen_random_uuid(),
  merchant_oid text not null unique,
  user_id uuid not null references public.morfeus_profiles (id) on delete cascade,
  plan_code text not null references public.morfeus_billing_plans (plan_code),
  amount_kurus integer not null,
  status text not null default 'pending',
  provider text not null default 'paytr',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.morfeus_billing_plans enable row level security;
alter table public.morfeus_payments enable row level security;

drop policy if exists billing_plans_select on public.morfeus_billing_plans;
create policy billing_plans_select on public.morfeus_billing_plans
  for select using (true);

drop policy if exists payments_select on public.morfeus_payments;
create policy payments_select on public.morfeus_payments
  for select to authenticated
  using (user_id = auth.uid() or public.morfeus_is_master_admin());

grant select on public.morfeus_billing_plans to anon, authenticated;
grant select on public.morfeus_payments to authenticated;

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
      new.premium_until := null;
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
  if p_plan_code not in ('monthly', 'annual') then
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

  if not found then
    insert into public.morfeus_billing_plans (plan_code, title, amount_kurus, period_days, updated_by)
    values (p_plan_code, coalesce(nullif(btrim(p_title), ''), p_plan_code), p_amount_kurus, p_period_days, auth.uid());
  end if;
end;
$fn$;

revoke all on function public.morfeus_admin_set_billing_plan(text, integer, integer, text) from public;
grant execute on function public.morfeus_admin_set_billing_plan(text, integer, integer, text) to authenticated;

create or replace function public.morfeus_admin_grant_plan(p_profile_id uuid, p_plan_code text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  days integer;
begin
  if not public.morfeus_is_master_admin() then
    raise exception 'not allowed';
  end if;

  select period_days into days
    from public.morfeus_billing_plans
   where plan_code = p_plan_code and is_active = true;

  if days is null then
    raise exception 'plan not found';
  end if;

  update public.morfeus_profiles
     set membership_tier = 'premium',
         premium_until = now() + make_interval(days => days)
   where id = p_profile_id;
end;
$fn$;

revoke all on function public.morfeus_admin_grant_plan(uuid, text) from public;
grant execute on function public.morfeus_admin_grant_plan(uuid, text) to authenticated;

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
     set membership_tier = tier,
         premium_until = case
           when tier = 'premium' then coalesce(premium_until, now() + interval '30 days')
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
  already boolean;
begin
  if p_merchant_oid is null or btrim(p_merchant_oid) = '' then
    raise exception 'invalid oid';
  end if;

  select period_days into days
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

  update public.morfeus_profiles
     set membership_tier = 'premium',
         premium_until = now() + make_interval(days => days)
   where id = p_user_id;
end;
$fn$;

revoke all on function public.morfeus_apply_paid_tier(uuid, text, text, integer) from public;
grant execute on function public.morfeus_apply_paid_tier(uuid, text, text, integer) to service_role;

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
  update public.morfeus_profiles
     set membership_tier = 'basic',
         premium_until = null
   where lower(coalesce(membership_tier, '')) = 'premium'
     and premium_until is not null
     and premium_until < now();
  get diagnostics n = row_count;
  return n;
end;
$fn$;

revoke all on function public.morfeus_expire_premium() from public;
grant execute on function public.morfeus_expire_premium() to authenticated;
