-- =============================================================================
-- Currio — full database schema (app + AI engine)
-- =============================================================================
--
-- Run in Supabase Dashboard → SQL Editor (single paste).
--
-- BEFORE running:
--   1. Optional: Authentication → Users → delete test users (fresh signup test)
--   2. This script DROPS all public Currio tables and recreates them.
--
-- AFTER running:
--   npm run curios:seed          # re-seed 119 static curios (needs service_role key)
--   npm run test:curio-feed      # verify curio-feed edge function
--
-- Maps to app (src/store/useAppStore.ts):
--   profiles              → display name / avatar
--   user_interests        → interests[]
--   bookmarks             → bookmarks[]
--   user_app_state        → onboarding, welcome, streak, theme, daily curio
--   user_seen_curios      → seenCurioIds[]
--   curios                → catalog (seed now, AI later via curio-feed)
--
-- AI / edge functions (Phase 3+):
--   curios, user_curio_queue, curio_generations, curio_feedback
-- =============================================================================

-- ── 0. Tear down (dependency order) ─────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.curio_feedback cascade;
drop table if exists public.curio_generations cascade;
drop table if exists public.user_curio_queue cascade;
drop table if exists public.user_seen_curios cascade;
drop table if exists public.welcome_email_queue cascade;
drop table if exists public.weekly_digest_queue cascade;
drop table if exists public.collection_items cascade;
drop table if exists public.collections cascade;
drop table if exists public.bookmarks cascade;
drop table if exists public.user_interests cascade;
drop table if exists public.user_app_state cascade;
drop table if exists public.profiles cascade;
drop table if exists public.curios cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;

-- ── 1. Helpers ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 2. Curio catalog (seed + AI) — create BEFORE user tables that reference it

create table public.curios (
  id text primary key,
  source text not null check (source in ('seed', 'ai')),
  category text not null check (category in (
    'Technology', 'Space', 'AI', 'History', 'Psychology', 'Philosophy',
    'Science', 'Nature', 'Business', 'Finance', 'Design', 'Mathematics',
    'Art', 'Music', 'Medicine', 'Wildlife', 'Geography'
  )),
  title text not null,
  content text not null,
  reading_time text not null default '1 min',
  image_url text,
  content_hash text,
  model text,
  prompt_version text,
  locale text not null default 'en',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_curios_category on public.curios (category);
create index idx_curios_content_hash on public.curios (content_hash);
create unique index idx_curios_hash_unique
  on public.curios (content_hash) where content_hash is not null;
create index idx_curios_published_locale
  on public.curios (is_published, locale) where is_published = true;

alter table public.curios enable row level security;

create policy "Curios: read published"
  on public.curios for select
  using (is_published = true);

-- ── 3. User profile ─────────────────────────────────────────────────────────

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles: users read own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles: users update own row"
  on public.profiles for update
  using (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── 4. App state (onboarding, streak, theme, daily curio) ─────────────────────

create table public.user_app_state (
  user_id uuid references auth.users on delete cascade primary key,
  has_completed_onboarding boolean not null default false,
  has_seen_welcome boolean not null default false,
  streak integer not null default 0 check (streak >= 0),
  last_open_date date,
  theme_mode text not null default 'system'
    check (theme_mode in ('light', 'dark', 'system')),
  todays_curio_id text references public.curios (id) on delete set null,
  todays_curio_date date,
  weekly_digest_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

create policy "App state: users read own row"
  on public.user_app_state for select
  using (auth.uid() = user_id);

create policy "App state: users insert own row"
  on public.user_app_state for insert
  with check (auth.uid() = user_id);

create policy "App state: users update own row"
  on public.user_app_state for update
  using (auth.uid() = user_id);

create trigger user_app_state_set_updated_at
  before update on public.user_app_state
  for each row execute function public.set_updated_at();

-- ── 5. Interests (onboarding topics) ────────────────────────────────────────

create table public.user_interests (
  user_id uuid references auth.users on delete cascade not null,
  category text not null check (category in (
    'Technology', 'Space', 'AI', 'History', 'Psychology', 'Philosophy',
    'Science', 'Nature', 'Business', 'Finance', 'Design', 'Mathematics',
    'Art', 'Music', 'Medicine', 'Wildlife', 'Geography'
  )),
  created_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.user_interests enable row level security;

create policy "Interests: users manage own rows"
  on public.user_interests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_user_interests_user_id on public.user_interests (user_id);

-- ── 6. Bookmarks ────────────────────────────────────────────────────────────

create table public.bookmarks (
  user_id uuid references auth.users on delete cascade not null,
  curio_id text not null references public.curios (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, curio_id)
);

alter table public.bookmarks enable row level security;

create policy "Bookmarks: users manage own rows"
  on public.bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_bookmarks_user_id on public.bookmarks (user_id);

-- ── 6b. Collections ─────────────────────────────────────────────────────────

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null check (char_length(trim(name)) between 1 and 48),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_collections_user_id on public.collections (user_id);

alter table public.collections enable row level security;

create policy "Collections: users manage own rows"
  on public.collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.collection_items (
  collection_id uuid references public.collections on delete cascade not null,
  curio_id text not null references public.curios (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, curio_id)
);

alter table public.collection_items enable row level security;

create policy "Collection items: users manage own rows"
  on public.collection_items for all
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- ── 7. Seen curios (rotation / no-repeat) ─────────────────────────────────────

create table public.user_seen_curios (
  user_id uuid references auth.users on delete cascade not null,
  curio_id text not null references public.curios (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, curio_id)
);

alter table public.user_seen_curios enable row level security;

create policy "Seen curios: users manage own rows"
  on public.user_seen_curios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_user_seen_curios_user_id on public.user_seen_curios (user_id);

-- ── 8. AI: prefetch queue ─────────────────────────────────────────────────────

create table public.user_curio_queue (
  user_id uuid references auth.users on delete cascade not null,
  position smallint not null check (position between 0 and 2),
  curio_id text not null references public.curios (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, position)
);

alter table public.user_curio_queue enable row level security;

create policy "Queue: users manage own rows"
  on public.user_curio_queue for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 9. AI: generation audit ───────────────────────────────────────────────────

create table public.curio_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  curio_id text references public.curios (id) on delete set null,
  category text not null,
  status text not null check (status in ('ok', 'failed', 'blocked')),
  model text,
  prompt_version text,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.curio_generations enable row level security;

create policy "Generations: users read own rows"
  on public.curio_generations for select
  using (auth.uid() = user_id);

create index idx_curio_generations_user_id on public.curio_generations (user_id);

-- ── 10. AI: feedback (thumbs up/down) ─────────────────────────────────────────

create table public.curio_feedback (
  user_id uuid references auth.users on delete cascade not null,
  curio_id text not null references public.curios (id) on delete cascade,
  signal smallint not null check (signal in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, curio_id)
);

alter table public.curio_feedback enable row level security;

create policy "Feedback: users manage own rows"
  on public.curio_feedback for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 11. Welcome email queue ───────────────────────────────────────────────────

create table public.welcome_email_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  email text not null,
  full_name text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_welcome_email_queue_status_created
  on public.welcome_email_queue (status, created_at);
create index idx_welcome_email_queue_user_id
  on public.welcome_email_queue (user_id);

alter table public.welcome_email_queue enable row level security;

-- No client policies: welcome email jobs are backend/service-role only.

-- ── 11b. Weekly digest queue + recipient helper ───────────────────────────────

create table public.weekly_digest_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  email text not null,
  week_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  curio_ids text[] not null default '{}',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, week_key)
);

create index idx_weekly_digest_queue_week_status
  on public.weekly_digest_queue (week_key, status);
create index idx_weekly_digest_queue_user_id
  on public.weekly_digest_queue (user_id);

alter table public.weekly_digest_queue enable row level security;

create or replace function public.get_weekly_digest_recipients()
returns table (
  user_id uuid,
  email text,
  full_name text,
  categories text[]
)
language sql
security definer
set search_path = public
as $$
  select
    u.id as user_id,
    u.email::text as email,
    p.full_name,
    coalesce(
      array_agg(distinct ui.category) filter (where ui.category is not null),
      '{}'::text[]
    ) as categories
  from auth.users u
  inner join public.user_app_state s on s.user_id = u.id
  left join public.profiles p on p.id = u.id
  left join public.user_interests ui on ui.user_id = u.id
  where s.weekly_digest_enabled = true
    and u.email is not null
    and length(trim(u.email)) > 0
  group by u.id, u.email, p.full_name;
$$;

revoke all on function public.get_weekly_digest_recipients() from public;
revoke all on function public.get_weekly_digest_recipients() from anon;
revoke all on function public.get_weekly_digest_recipients() from authenticated;
grant execute on function public.get_weekly_digest_recipients() to service_role;

-- ── 12. Signup trigger (MUST be last — inserts app rows + email job) ──────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    display_name,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_app_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  if new.email is not null then
    insert into public.welcome_email_queue (user_id, email, full_name)
    values (new.id, new.email, display_name);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 13. Grants (Supabase roles) ───────────────────────────────────────────────

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on public.curios to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_app_state to authenticated;
grant select, insert, update, delete on public.user_interests to authenticated;
grant select, insert, update, delete on public.bookmarks to authenticated;
grant select, insert, update, delete on public.user_seen_curios to authenticated;
grant select, insert, update, delete on public.user_curio_queue to authenticated;
grant select on public.curio_generations to authenticated;
grant select, insert, update, delete on public.curio_feedback to authenticated;
grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.collection_items to authenticated;

grant all on all tables in schema public to service_role;
