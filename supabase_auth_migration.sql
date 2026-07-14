create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.posts
add column if not exists user_id uuid references public.profiles(id) on delete set null,
add column if not exists updated_at timestamptz,
add column if not exists image_path text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.posts enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Allow Insert" on public.posts;
drop policy if exists "Allow Select" on public.posts;
drop policy if exists "Anyone can read posts" on public.posts;
drop policy if exists "Authenticated users can insert own posts" on public.posts;
drop policy if exists "Users can update own posts" on public.posts;
drop policy if exists "Users can delete own posts" on public.posts;

create policy "Anyone can read posts"
on public.posts
for select
using (true);

create policy "Authenticated users can insert own posts"
on public.posts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own posts"
on public.posts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own posts"
on public.posts
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can read profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Anyone can read profiles"
on public.profiles
for select
using (true);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Allow anonymous uploads 1kck3wh_0" on storage.objects;
drop policy if exists "Allow anonymous uploads 1kck3wh_1" on storage.objects;
drop policy if exists "Anyone can read guestbook images" on storage.objects;
drop policy if exists "Authenticated users can upload own guestbook images" on storage.objects;
drop policy if exists "Users can delete own guestbook images" on storage.objects;

create policy "Anyone can read guestbook images"
on storage.objects
for select
using (bucket_id = 'guestbook');

create policy "Authenticated users can upload own guestbook images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'guestbook'
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "Users can delete own guestbook images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'guestbook'
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
