-- TOZRA Creator Profiles + Follow Graph
-- Supabase Dashboard > SQL Editor > Run once.
-- Existing public.profiles from TOZRA_CONNECT_2_PROFILES.sql is reused.

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

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));

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

create table if not exists public.follows (
  id bigint generated always as identity primary key,
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  constraint follows_no_self check (follower_id <> followed_id),
  constraint follows_unique_pair unique (follower_id, followed_id)
);

create index if not exists follows_followed_status_idx
  on public.follows (followed_id, status, created_at desc);
create index if not exists follows_follower_status_idx
  on public.follows (follower_id, status, created_at desc);

alter table public.follows enable row level security;

drop policy if exists "Users can view accepted follows and their own requests" on public.follows;
create policy "Users can view accepted follows and their own requests"
on public.follows for select to authenticated
using (status = 'accepted' or follower_id = (select auth.uid()) or followed_id = (select auth.uid()));

drop policy if exists "Users can create their own follow" on public.follows;
create policy "Users can create their own follow"
on public.follows for insert to authenticated
with check (
  follower_id = (select auth.uid())
  and follower_id <> followed_id
  and status in ('pending','accepted')
);

drop policy if exists "Profile owners can accept incoming requests" on public.follows;
create policy "Profile owners can accept incoming requests"
on public.follows for update to authenticated
using (followed_id = (select auth.uid()) and status = 'pending')
with check (followed_id = (select auth.uid()) and status = 'accepted');

drop policy if exists "Either participant can unfollow or reject" on public.follows;
create policy "Either participant can unfollow or reject"
on public.follows for delete to authenticated
using (follower_id = (select auth.uid()) or followed_id = (select auth.uid()));

-- The database, not the client, decides whether a follow is immediate or needs approval.
create or replace function public.tozra_set_follow_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_private boolean;
begin
  select is_private into target_private
  from public.profiles
  where id = new.followed_id;

  if target_private is null then
    raise exception 'Takip edilecek profil bulunamadı.';
  end if;

  new.status := case when target_private then 'pending' else 'accepted' end;
  return new;
end;
$$;

drop trigger if exists tozra_follow_status_before_insert on public.follows;
create trigger tozra_follow_status_before_insert
before insert on public.follows
for each row execute function public.tozra_set_follow_status();

-- Profile photo bucket (safe to run repeatedly).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = true, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

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
