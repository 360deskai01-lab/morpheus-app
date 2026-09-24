create extension if not exists pgcrypto;

-- Forum
create table if not exists public.morfeus_forum_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  display_order integer not null default 0
);

create table if not exists public.morfeus_forum_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.morfeus_forum_categories (id) on delete set null,
  author_id uuid references public.morfeus_profiles (id) on delete cascade,
  title text not null,
  content text not null default '',
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  views_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.morfeus_forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.morfeus_forum_topics (id) on delete cascade,
  author_id uuid references public.morfeus_profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Events
create table if not exists public.morfeus_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  city text,
  venue text,
  event_date timestamptz,
  ticket_price text,
  ticket_url text,
  image_url text,
  status text not null default 'PENDING',
  created_by uuid references public.morfeus_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.morfeus_events add column if not exists description text default '';
alter table public.morfeus_events add column if not exists ticket_price text;
alter table public.morfeus_events add column if not exists ticket_url text;
alter table public.morfeus_events add column if not exists image_url text;
alter table public.morfeus_events add column if not exists status text default 'PENDING';
alter table public.morfeus_events add column if not exists created_by uuid;

-- Courses
create table if not exists public.morfeus_courses (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.morfeus_profiles (id) on delete set null,
  title text not null,
  description text not null default '',
  instrument text,
  level text,
  price_amount numeric not null default 0,
  is_free boolean not null default true,
  thumbnail_url text,
  preview_video_url text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.morfeus_course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.morfeus_courses (id) on delete cascade,
  title text not null,
  duration_min integer not null default 0,
  video_url text,
  lesson_order integer not null default 0,
  is_preview boolean not null default false,
  created_at timestamptz not null default now()
);

-- Store
create table if not exists public.morfeus_store_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.morfeus_profiles (id) on delete set null,
  title text not null,
  description text,
  category text,
  price numeric not null default 0,
  condition text,
  city text,
  contact_info text,
  image_url text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

-- Shares
create table if not exists public.morfeus_shares (
  id uuid primary key default gen_random_uuid(),
  share_code text not null unique,
  payload_type text not null default 'SONG',
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.morfeus_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Corrections
create table if not exists public.song_corrections (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references public.morfeus_songs (id) on delete cascade,
  user_id uuid references public.morfeus_profiles (id) on delete set null,
  suggested_content text,
  notes text,
  created_at timestamptz not null default now()
);

-- Sub-admin roles
create table if not exists public.morfeus_admin_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.morfeus_profiles (id) on delete cascade,
  module text not null,
  can_read boolean not null default true,
  can_write boolean not null default false,
  can_delete boolean not null default false,
  unique (profile_id, module)
);

insert into public.morfeus_forum_categories (title, description, display_order)
select * from (values
  ('Genel', 'Sahne sohbeti ve tanışma', 1),
  ('Akor ve düzenleme', 'Tab, ton ve aranjman', 2),
  ('Sahne ve ekipman', 'Set, mekan, teknik', 3),
  ('Duyurular', 'Morpheus duyuruları', 4)
) as seed(title, description, display_order)
where not exists (select 1 from public.morfeus_forum_categories);

alter table public.morfeus_forum_categories enable row level security;
alter table public.morfeus_forum_topics enable row level security;
alter table public.morfeus_forum_replies enable row level security;
alter table public.morfeus_events enable row level security;
alter table public.morfeus_courses enable row level security;
alter table public.morfeus_course_lessons enable row level security;
alter table public.morfeus_store_products enable row level security;
alter table public.morfeus_shares enable row level security;
alter table public.song_corrections enable row level security;
alter table public.morfeus_admin_roles enable row level security;

drop policy if exists forum_cat_select on public.morfeus_forum_categories;
create policy forum_cat_select on public.morfeus_forum_categories for select using (true);

drop policy if exists forum_topics_select on public.morfeus_forum_topics;
create policy forum_topics_select on public.morfeus_forum_topics for select using (true);
drop policy if exists forum_topics_insert on public.morfeus_forum_topics;
create policy forum_topics_insert on public.morfeus_forum_topics for insert to authenticated with check (author_id = auth.uid());
drop policy if exists forum_topics_delete on public.morfeus_forum_topics;
create policy forum_topics_delete on public.morfeus_forum_topics for delete to authenticated using (author_id = auth.uid() or public.morfeus_is_master_admin());

drop policy if exists forum_replies_select on public.morfeus_forum_replies;
create policy forum_replies_select on public.morfeus_forum_replies for select using (true);
drop policy if exists forum_replies_insert on public.morfeus_forum_replies;
create policy forum_replies_insert on public.morfeus_forum_replies for insert to authenticated with check (author_id = auth.uid());
drop policy if exists forum_replies_delete on public.morfeus_forum_replies;
create policy forum_replies_delete on public.morfeus_forum_replies for delete to authenticated using (author_id = auth.uid() or public.morfeus_is_master_admin());

drop policy if exists events_select on public.morfeus_events;
create policy events_select on public.morfeus_events for select using (
  status = 'APPROVED' or created_by = auth.uid() or public.morfeus_is_master_admin()
);
drop policy if exists events_insert on public.morfeus_events;
create policy events_insert on public.morfeus_events for insert to authenticated with check (true);
drop policy if exists events_update on public.morfeus_events;
create policy events_update on public.morfeus_events for update to authenticated
  using (created_by = auth.uid() or public.morfeus_is_master_admin())
  with check (created_by = auth.uid() or public.morfeus_is_master_admin());
drop policy if exists events_delete on public.morfeus_events;
create policy events_delete on public.morfeus_events for delete to authenticated
  using (public.morfeus_is_master_admin());

drop policy if exists courses_select on public.morfeus_courses;
create policy courses_select on public.morfeus_courses for select using (
  status = 'APPROVED' or instructor_id = auth.uid() or public.morfeus_is_master_admin()
);
drop policy if exists courses_insert on public.morfeus_courses;
create policy courses_insert on public.morfeus_courses for insert to authenticated with check (instructor_id = auth.uid() or public.morfeus_is_master_admin());
drop policy if exists courses_update on public.morfeus_courses;
create policy courses_update on public.morfeus_courses for update to authenticated
  using (instructor_id = auth.uid() or public.morfeus_is_master_admin());
drop policy if exists lessons_select on public.morfeus_course_lessons;
create policy lessons_select on public.morfeus_course_lessons for select using (true);
drop policy if exists lessons_write on public.morfeus_course_lessons;
create policy lessons_write on public.morfeus_course_lessons for all to authenticated
  using (public.morfeus_is_master_admin()) with check (public.morfeus_is_master_admin());

drop policy if exists store_select on public.morfeus_store_products;
create policy store_select on public.morfeus_store_products for select using (
  status = 'APPROVED' or seller_id = auth.uid() or public.morfeus_is_master_admin()
);
drop policy if exists store_insert on public.morfeus_store_products;
create policy store_insert on public.morfeus_store_products for insert to authenticated with check (seller_id = auth.uid() or public.morfeus_is_master_admin());
drop policy if exists store_update on public.morfeus_store_products;
create policy store_update on public.morfeus_store_products for update to authenticated
  using (seller_id = auth.uid() or public.morfeus_is_master_admin());

drop policy if exists shares_select on public.morfeus_shares;
create policy shares_select on public.morfeus_shares for select using (true);
drop policy if exists shares_insert on public.morfeus_shares;
create policy shares_insert on public.morfeus_shares for insert to authenticated with check (true);
drop policy if exists shares_update on public.morfeus_shares;
create policy shares_update on public.morfeus_shares for update to authenticated using (true) with check (true);

drop policy if exists corr_select on public.song_corrections;
create policy corr_select on public.song_corrections for select using (
  user_id = auth.uid() or public.morfeus_is_master_admin()
);
drop policy if exists corr_insert on public.song_corrections;
create policy corr_insert on public.song_corrections for insert to authenticated with check (user_id = auth.uid());
drop policy if exists corr_delete on public.song_corrections;
create policy corr_delete on public.song_corrections for delete to authenticated using (
  user_id = auth.uid() or public.morfeus_is_master_admin()
);

drop policy if exists roles_select on public.morfeus_admin_roles;
create policy roles_select on public.morfeus_admin_roles for select using (
  profile_id = auth.uid() or public.morfeus_is_master_admin()
);
drop policy if exists roles_write on public.morfeus_admin_roles;
create policy roles_write on public.morfeus_admin_roles for all to authenticated
  using (public.morfeus_is_master_admin()) with check (public.morfeus_is_master_admin());

grant select on public.morfeus_forum_categories to anon, authenticated;
grant select on public.morfeus_forum_topics to anon, authenticated;
grant select on public.morfeus_forum_replies to anon, authenticated;
grant insert, delete on public.morfeus_forum_topics to authenticated;
grant insert, delete on public.morfeus_forum_replies to authenticated;

grant select on public.morfeus_events to anon, authenticated;
grant insert, update, delete on public.morfeus_events to authenticated;

grant select on public.morfeus_courses to anon, authenticated;
grant insert, update on public.morfeus_courses to authenticated;
grant select on public.morfeus_course_lessons to anon, authenticated;
grant insert, update, delete on public.morfeus_course_lessons to authenticated;

grant select on public.morfeus_store_products to anon, authenticated;
grant insert, update on public.morfeus_store_products to authenticated;

grant select on public.morfeus_shares to anon, authenticated;
grant insert, update on public.morfeus_shares to authenticated;

grant select, insert, delete on public.song_corrections to authenticated;
grant select, insert, update, delete on public.morfeus_admin_roles to authenticated;
