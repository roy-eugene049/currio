-- Phase 4 — Weekly digest email
-- Opt-in flag on user_app_state + audit queue + recipient helper for Edge Function.
-- Schedule Sunday runs via Supabase Cron → POST /functions/v1/send-weekly-digest
-- (see docs/WEEKLY_DIGEST.md).

alter table public.user_app_state
  add column if not exists weekly_digest_enabled boolean not null default true;

create table if not exists public.weekly_digest_queue (
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

create index if not exists idx_weekly_digest_queue_week_status
  on public.weekly_digest_queue (week_key, status);

create index if not exists idx_weekly_digest_queue_user_id
  on public.weekly_digest_queue (user_id);

alter table public.weekly_digest_queue enable row level security;

grant all on public.weekly_digest_queue to service_role;

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
