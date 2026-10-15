-- =============================================================================
--  Nyanchiew Malual — Supabase schema
--  Run in the Supabase SQL Editor (or `supabase db push`). Safe to run again.
--
--  Access model
--    • episodes / articles : public read, allowlisted studio admins write
--    • bookings            : API insert, studio admins read/update/delete
--    • subscribers         : API insert, studio admins read/delete
--    • studio_admins       : membership managed only by the service role / SQL owner
--
--  Create the owner's authentication account, then run create-admin.sql to grant
--  studio access. Signing in alone never grants administrative permissions.
-- =============================================================================

begin;

create extension if not exists pg_trgm with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.episodes (
  id               uuid primary key default gen_random_uuid(),
  episode_number   integer not null check (episode_number > 0),
  title            text not null,
  slug             text not null unique,
  description      text not null default '',
  guest_name       text,
  video_url        text not null,
  video_id         text not null constraint episodes_video_id_format_check check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  thumbnail_url    text,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  views_count      integer not null default 0 check (views_count >= 0),
  published_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create table if not exists public.articles (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  category          text not null
                    check (category in ('Investigative', 'Culture', 'Personal Essay', 'Published Work')),
  excerpt           text not null default '',
  body              text not null default '',
  cover_image_url   text,
  external_url      text,
  read_time_minutes integer check (read_time_minutes is null or read_time_minutes > 0),
  published_at      timestamptz not null default now()
);

create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  guest_name       text not null check (char_length(guest_name) between 1 and 200),
  guest_email      text not null check (char_length(guest_email) between 3 and 320),
  pronouns         text,
  organization     text,
  social_links     text,
  inquiry_type     text not null
                   check (inquiry_type in (
                     'Podcast Guest Pitch',
                     'Story Lead',
                     'Book Nyanchiew - Speaking/Media/Collab'
                   )),
  -- The unified intake form's selected reason (e.g. "Pitch a Written Story Idea").
  inquiry_subtype  text,
  story_pitch      text not null check (char_length(story_pitch) between 1 and 8000),
  talking_points   text,
  project_timeline text,
  budget_details   text,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'archived')),
  created_at       timestamptz not null default now()
);

create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (char_length(email) between 3 and 320),
  created_at timestamptz not null default now()
);

create table if not exists public.studio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.studio_admins enable row level security;
revoke all on table public.studio_admins from public, anon, authenticated;
grant all on table public.studio_admins to service_role;

-- This exposes only the caller's membership, never the private allowlist.
create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.studio_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_studio_admin() from public, anon;
grant execute on function public.is_studio_admin() to authenticated, service_role;

-- Keep the unified intake form's type/reason pairs consistent for new writes.
-- NOT VALID preserves any legacy rows while enforcing the rule going forward.
alter table public.bookings drop constraint if exists bookings_inquiry_subtype_check;
alter table public.bookings add constraint bookings_inquiry_subtype_check check (
  inquiry_subtype is not null and (
    (inquiry_type = 'Podcast Guest Pitch' and inquiry_subtype in ('Be a Podcast Guest', 'Nominate Someone Else'))
  or (inquiry_type = 'Story Lead' and inquiry_subtype = 'Pitch a Written Story Idea')
  or (inquiry_type = 'Book Nyanchiew - Speaking/Media/Collab' and inquiry_subtype in ('Event Hosting / Moderation', 'Speaking Engagement', 'Journalism Commission', 'Brand Collaboration'))
  )
) not valid;

-- Harden existing installations too. NOT VALID lets the migration complete if a
-- legacy row needs cleanup, while still enforcing the rule for new writes.
alter table public.episodes drop constraint if exists episodes_video_id_format_check;
alter table public.episodes add constraint episodes_video_id_format_check
  check (video_id ~ '^[A-Za-z0-9_-]{11}$') not valid;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists episodes_published_at_idx  on public.episodes (published_at desc);
create index if not exists episodes_views_count_idx   on public.episodes (views_count desc);
create index if not exists episodes_episode_number_idx on public.episodes (episode_number desc);

-- Trigram indexes speed up the ILIKE '%term%' search used by /api/episodes
create index if not exists episodes_title_trgm_idx
  on public.episodes using gin (title extensions.gin_trgm_ops);
create index if not exists episodes_guest_trgm_idx
  on public.episodes using gin (guest_name extensions.gin_trgm_ops);
create index if not exists episodes_description_trgm_idx
  on public.episodes using gin (description extensions.gin_trgm_ops);

create index if not exists articles_published_at_idx on public.articles (published_at desc);
create index if not exists articles_category_idx     on public.articles (category);

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_status_idx     on public.bookings (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: atomic view counter
--   SECURITY DEFINER + execute restricted to service_role, so the counter can only
--   be bumped through our /api/episodes/:id/view route (not directly from a browser).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.increment_episode_views(ep_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.episodes
     set views_count = views_count + 1
   where id = ep_id
  returning views_count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_episode_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_episode_views(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.episodes    enable row level security;
alter table public.articles    enable row level security;
alter table public.bookings    enable row level security;
alter table public.subscribers enable row level security;

-- Explicit privileges keep installations independent of project default grants.
-- RLS below still decides which authenticated accounts can access each row.
grant usage on schema public to anon, authenticated, service_role;
revoke all on table public.episodes, public.articles, public.bookings, public.subscribers
  from public, anon, authenticated;
grant select on table public.episodes, public.articles to anon, authenticated;
grant insert, update, delete on table public.episodes, public.articles to authenticated;
grant select, update, delete on table public.bookings to authenticated;
grant select, delete on table public.subscribers to authenticated;
grant all on table public.episodes, public.articles, public.bookings, public.subscribers to service_role;

-- episodes ---------------------------------------------------------------------
drop policy if exists "episodes_public_read"  on public.episodes;
drop policy if exists "episodes_admin_read"   on public.episodes;
drop policy if exists "episodes_admin_insert" on public.episodes;
drop policy if exists "episodes_admin_update" on public.episodes;
drop policy if exists "episodes_admin_delete" on public.episodes;

create policy "episodes_public_read"  on public.episodes
  for select to anon, authenticated using (published_at <= now() or (select public.is_studio_admin()));
create policy "episodes_admin_insert" on public.episodes
  for insert to authenticated with check ((select public.is_studio_admin()));
create policy "episodes_admin_update" on public.episodes
  for update to authenticated using ((select public.is_studio_admin()))
  with check ((select public.is_studio_admin()));
create policy "episodes_admin_delete" on public.episodes
  for delete to authenticated using ((select public.is_studio_admin()));

-- articles ---------------------------------------------------------------------
drop policy if exists "articles_public_read"  on public.articles;
drop policy if exists "articles_admin_read"   on public.articles;
drop policy if exists "articles_admin_insert" on public.articles;
drop policy if exists "articles_admin_update" on public.articles;
drop policy if exists "articles_admin_delete" on public.articles;

create policy "articles_public_read"  on public.articles
  for select to anon, authenticated using (published_at <= now() or (select public.is_studio_admin()));
create policy "articles_admin_insert" on public.articles
  for insert to authenticated with check ((select public.is_studio_admin()));
create policy "articles_admin_update" on public.articles
  for update to authenticated using ((select public.is_studio_admin()))
  with check ((select public.is_studio_admin()));
create policy "articles_admin_delete" on public.articles
  for delete to authenticated using ((select public.is_studio_admin()));

-- bookings ---------------------------------------------------------------------
-- Submissions are inserted only by /api/book with the server service role.
-- Reading names, emails, and pitches is restricted to studio admins.
drop policy if exists "bookings_public_insert" on public.bookings;
drop policy if exists "bookings_admin_select"  on public.bookings;
drop policy if exists "bookings_admin_update"  on public.bookings;
drop policy if exists "bookings_admin_delete"  on public.bookings;

revoke insert on table public.bookings from anon, authenticated;

create policy "bookings_admin_select" on public.bookings
  for select to authenticated using ((select public.is_studio_admin()));
create policy "bookings_admin_update" on public.bookings
  for update to authenticated using ((select public.is_studio_admin()))
  with check ((select public.is_studio_admin()));
create policy "bookings_admin_delete" on public.bookings
  for delete to authenticated using ((select public.is_studio_admin()));

-- subscribers ------------------------------------------------------------------
-- No public policies: inserts go through /api/subscribe using the service role.
drop policy if exists "subscribers_admin_select" on public.subscribers;
drop policy if exists "subscribers_admin_delete" on public.subscribers;

create policy "subscribers_admin_select" on public.subscribers
  for select to authenticated using ((select public.is_studio_admin()));
create policy "subscribers_admin_delete" on public.subscribers
  for delete to authenticated using ((select public.is_studio_admin()));

commit;
