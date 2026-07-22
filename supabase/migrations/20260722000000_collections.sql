-- Phase 6: user-named collections of saved curios

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null check (char_length(trim(name)) between 1 and 48),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_collections_user_id
  on public.collections (user_id);

create index if not exists idx_collections_user_updated
  on public.collections (user_id, updated_at desc);

alter table public.collections enable row level security;

create policy "Collections: users manage own rows"
  on public.collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.collection_items (
  collection_id uuid references public.collections on delete cascade not null,
  curio_id text not null references public.curios (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, curio_id)
);

create index if not exists idx_collection_items_curio_id
  on public.collection_items (curio_id);

alter table public.collection_items enable row level security;

create policy "Collection items: users manage own rows"
  on public.collection_items for all
  using (
    exists (
      select 1
      from public.collections c
      where c.id = collection_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.collections c
      where c.id = collection_id
        and c.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.collection_items to authenticated;
