-- HobbyHub database setup
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.
-- Uses Supabase Auth (including anonymous sign-in) for per-record ownership.

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  content text check (content is null or char_length(content) <= 10000),
  game_title text not null default 'General Gaming' check (char_length(trim(game_title)) between 1 and 100),
  post_type text not null default 'Discussion' check (post_type in ('Discussion', 'Question', 'Opinion', 'Guide', 'Showcase')),
  image_url text,
  video_url text,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Community Player' check (char_length(author_name) <= 40),
  referenced_post_id uuid references public.posts(id) on delete set null,
  upvotes integer not null default 0 check (upvotes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Community Player' check (char_length(author_name) <= 40),
  content text not null check (char_length(trim(content)) between 1 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_upvotes_idx on public.posts (upvotes desc);
create index if not exists posts_game_title_idx on public.posts (game_title);
create index if not exists posts_post_type_idx on public.posts (post_type);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at asc);

alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts" on public.posts
  for select to anon, authenticated using (true);

drop policy if exists "Signed-in users can create their own posts" on public.posts;
create policy "Signed-in users can create their own posts" on public.posts
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "Authors can update their own posts" on public.posts;
create policy "Authors can update their own posts" on public.posts
  for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "Authors can delete their own posts" on public.posts;
create policy "Authors can delete their own posts" on public.posts
  for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments" on public.comments
  for select to anon, authenticated using (true);

drop policy if exists "Signed-in users can create their own comments" on public.comments;
create policy "Signed-in users can create their own comments" on public.comments
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "Authors can delete their own comments" on public.comments;
create policy "Authors can delete their own comments" on public.comments
  for delete to authenticated using (auth.uid() = author_id);

-- Atomic increment: concurrent upvotes won't overwrite one another.
create or replace function public.increment_post_upvotes(post_id_input uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare new_count integer;
begin
  if auth.uid() is null then
    raise exception 'You must have a session to upvote.';
  end if;

  update public.posts
  set upvotes = upvotes + 1
  where id = post_id_input
  returning upvotes into new_count;

  if new_count is null then
    raise exception 'Post not found.';
  end if;

  return new_count;
end;
$$;

revoke all on function public.increment_post_upvotes(uuid) from public;
grant execute on function public.increment_post_upvotes(uuid) to authenticated;

grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;
grant select, insert, delete on public.comments to authenticated;
grant select on public.comments to anon;

-- Image uploads: a public-read bucket with authenticated uploads.
-- Public means uploaded images can be viewed by anyone with their URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "Public can view post images" on storage.objects;
create policy "Public can view post images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'post-images');

drop policy if exists "Authenticated users can upload post images" on storage.objects;
create policy "Authenticated users can upload post images" on storage.objects
  for insert to authenticated with check (bucket_id = 'post-images' and owner = auth.uid());

drop policy if exists "Uploaders can delete their own post images" on storage.objects;
create policy "Uploaders can delete their own post images" on storage.objects
  for delete to authenticated using (bucket_id = 'post-images' and owner = auth.uid());
