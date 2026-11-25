-- TOZRA COMMUNITY — posts, likes, comments and media
-- Run once in Supabase Dashboard > SQL Editor.
-- Requires the existing public.profiles and public.follows tables from
-- TOZRA_CREATOR_PROFILES.sql.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null constraint community_posts_author_id_fkey
    references public.profiles(id) on delete cascade,
  body text not null default '',
  media_path text,
  media_type text,
  created_at timestamptz not null default now(),
  constraint community_posts_body_length check (char_length(body) <= 2200),
  constraint community_posts_has_content check (char_length(trim(body)) > 0 or media_path is not null)
);

create index if not exists community_posts_created_idx
  on public.community_posts (created_at desc);
create index if not exists community_posts_author_created_idx
  on public.community_posts (author_id, created_at desc);

create table if not exists public.community_likes (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_likes_unique unique (post_id, user_id)
);
create index if not exists community_likes_post_idx on public.community_likes(post_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null constraint community_comments_author_id_fkey
    references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint community_comments_body_length check (char_length(body) between 1 and 500)
);
create index if not exists community_comments_post_created_idx
  on public.community_comments(post_id, created_at asc);

alter table public.community_posts enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_comments enable row level security;

-- Public profiles are visible to all signed-in users. Private profiles are
-- visible to their owner and accepted followers only.
drop policy if exists "Community posts visible to profile audience" on public.community_posts;
create policy "Community posts visible to profile audience"
on public.community_posts for select to authenticated
using (
  author_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = community_posts.author_id
      and (
        p.is_private = false
        or exists (
          select 1 from public.follows f
          where f.follower_id = (select auth.uid())
            and f.followed_id = community_posts.author_id
            and f.status = 'accepted'
        )
      )
  )
);

drop policy if exists "Users create own community posts" on public.community_posts;
create policy "Users create own community posts"
on public.community_posts for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_private = false)
);

drop policy if exists "Users update own community posts" on public.community_posts;
create policy "Users update own community posts"
on public.community_posts for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

drop policy if exists "Users delete own community posts" on public.community_posts;
create policy "Users delete own community posts"
on public.community_posts for delete to authenticated
using (author_id = (select auth.uid()));

drop policy if exists "Community likes visible for visible posts" on public.community_likes;
create policy "Community likes visible for visible posts"
on public.community_likes for select to authenticated
using (exists (select 1 from public.community_posts p where p.id = community_likes.post_id));

drop policy if exists "Users like visible posts" on public.community_likes;
create policy "Users like visible posts"
on public.community_likes for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.community_posts p where p.id = community_likes.post_id)
);

drop policy if exists "Users remove own likes" on public.community_likes;
create policy "Users remove own likes"
on public.community_likes for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Community comments visible for visible posts" on public.community_comments;
create policy "Community comments visible for visible posts"
on public.community_comments for select to authenticated
using (exists (select 1 from public.community_posts p where p.id = community_comments.post_id));

drop policy if exists "Users comment on visible posts" on public.community_comments;
create policy "Users comment on visible posts"
on public.community_comments for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (select 1 from public.community_posts p where p.id = community_comments.post_id)
);

drop policy if exists "Users delete own community comments" on public.community_comments;
create policy "Users delete own community comments"
on public.community_comments for delete to authenticated
using (author_id = (select auth.uid()));

-- Private media bucket: only the uploader can write. Signed URLs are generated
-- by the app for display; public sharing is limited to signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  false,
  31457280,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = 31457280,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm'];

drop policy if exists "Community media uploader can add files" on storage.objects;
create policy "Community media uploader can add files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'community-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Community media uploader can remove files" on storage.objects;
create policy "Community media uploader can remove files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'community-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- A viewer can create a signed URL only when RLS lets them see the post
-- that references the media path.
drop policy if exists "Community media visible with post" on storage.objects;
create policy "Community media visible with post"
on storage.objects for select to authenticated
using (
  bucket_id = 'community-media'
  and exists (
    select 1 from public.community_posts cp
    where cp.media_path = objects.name
  )
);


-- Followers with accepted requests can see private creator profile details.
drop policy if exists "Profiles are visible to authenticated users" on public.profiles;
create policy "Profiles are visible to authenticated users"
on public.profiles for select to authenticated
using (
  is_private = false
  or id = (select auth.uid())
  or exists (
    select 1 from public.follows f
    where f.follower_id = (select auth.uid())
      and f.followed_id = profiles.id
      and f.status = 'accepted'
  )
);
