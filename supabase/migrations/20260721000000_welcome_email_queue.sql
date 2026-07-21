-- Queue welcome emails when Supabase Auth creates a user.
-- A Supabase Database Webhook should POST inserts from this table to:
--   /functions/v1/send-welcome-email

create table if not exists public.welcome_email_queue (
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

create index if not exists idx_welcome_email_queue_status_created
  on public.welcome_email_queue (status, created_at);

create index if not exists idx_welcome_email_queue_user_id
  on public.welcome_email_queue (user_id);

alter table public.welcome_email_queue enable row level security;

grant all on public.welcome_email_queue to service_role;

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
