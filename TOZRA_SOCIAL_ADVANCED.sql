-- TOZRA SOCIAL ADVANCED: 24-hour stories and story views
-- Run once in the EXISTING TOZRA Supabase project, after TOZRA_COMMUNITY.sql.

create table if not exists public.community_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null constraint community_stories_author_id_fkey references public.profiles(id) on delete cascade,
  media_path text not null,
  media_type text not null check (media_type in ('image/jpeg','image/png','image/webp','video/mp4','video/webm')),
  caption text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint community_stories_caption_length check (char_length(caption) <= 240)
);
create index if not exists community_stories_active_idx on public.community_stories(expires_at desc, created_at desc);
create index if not exists community_stories_author_idx on public.community_stories(author_id, created_at desc);

create table if not exists public.community_story_views (
  story_id uuid not null references public.community_stories(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.community_stories enable row level security;
alter table public.community_story_views enable row level security;

drop policy if exists "Stories visible to profile audience" on public.community_stories;
create policy "Stories visible to profile audience" on public.community_stories
for select to authenticated using (
  expires_at > now() and (
    author_id = (select auth.uid()) or exists (
      select 1 from public.profiles p where p.id = community_stories.author_id and (
        p.is_private = false or exists (
          select 1 from public.follows f where f.follower_id = (select auth.uid())
          and f.followed_id = community_stories.author_id and f.status = 'accepted'
        )
      )
    )
  )
);

drop policy if exists "Users create own stories" on public.community_stories;
create policy "Users create own stories" on public.community_stories
for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_private = false
  )
);

drop policy if exists "Users delete own stories" on public.community_stories;
create policy "Users delete own stories" on public.community_stories
for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "Users record story views" on public.community_story_views;
create policy "Users record story views" on public.community_story_views
for insert to authenticated with check (
  viewer_id = (select auth.uid()) and exists (
    select 1 from public.community_stories s where s.id = community_story_views.story_id
    and s.author_id <> (select auth.uid()) and s.expires_at > now()
  )
);
drop policy if exists "Users update own story views" on public.community_story_views;
create policy "Users update own story views" on public.community_story_views
for update to authenticated using (viewer_id = (select auth.uid()))
with check (viewer_id = (select auth.uid()));
drop policy if exists "Story owners see views" on public.community_story_views;
create policy "Story owners see views" on public.community_story_views
for select to authenticated using (
  viewer_id = (select auth.uid()) or exists (
    select 1 from public.community_stories s where s.id = community_story_views.story_id
    and s.author_id = (select auth.uid())
  )
);

grant usage on schema public to authenticated;
grant select, insert, delete on public.community_stories to authenticated;
grant select, insert, update on public.community_story_views to authenticated;

-- Extend the existing private bucket read policy so story media can be signed too.
drop policy if exists "Community media visible with post" on storage.objects;
create policy "Community media visible with post" on storage.objects
for select to authenticated using (
  bucket_id = 'community-media' and (
    exists (select 1 from public.community_posts cp where cp.media_path = objects.name)
    or exists (select 1 from public.community_stories cs where cs.media_path = objects.name and cs.expires_at > now())
  )
);
