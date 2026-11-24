-- TOZRA Connect 2.0: real user profiles
-- Run this once in Supabase Dashboard > SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text not null default '',
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  is_private boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_.]{3,24}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 48),
  constraint profiles_bio_length check (char_length(bio) <= 160)
);
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));
alter table public.profiles enable row level security;

drop policy if exists "Profiles are visible to authenticated users" on public.profiles;
create policy "Profiles are visible to authenticated users"
on public.profiles for select to authenticated
using (is_private = false or id = (select auth.uid()));

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
on storage.objects for select
using (bucket_id = 'profile-avatars');

drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users update their own avatar" on storage.objects;
create policy "Users update their own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete their own avatar" on storage.objects;
create policy "Users delete their own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
