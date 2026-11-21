-- TOZRA Advanced Memory v2
-- Supabase SQL Editor'de bir kez çalıştır.
create table if not exists public.user_memories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1500),
  category text not null default 'Genel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_memories_user_updated_idx
  on public.user_memories (user_id, updated_at desc);

alter table public.user_memories enable row level security;

drop policy if exists "Users can read own TOZRA memories" on public.user_memories;
create policy "Users can read own TOZRA memories"
  on public.user_memories for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own TOZRA memories" on public.user_memories;
create policy "Users can insert own TOZRA memories"
  on public.user_memories for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own TOZRA memories" on public.user_memories;
create policy "Users can update own TOZRA memories"
  on public.user_memories for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own TOZRA memories" on public.user_memories;
create policy "Users can delete own TOZRA memories"
  on public.user_memories for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_memories to authenticated;
