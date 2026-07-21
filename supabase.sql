-- «Мой гардероб»: база данных, RLS и приватный Storage.
-- Запустите весь файл в Supabase Dashboard → SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.clothes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  category text not null,
  subcategory text,
  colors text[] not null default '{}',
  seasons text[] not null default '{}',
  style text,
  last_worn_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  comment text,
  occasion text,
  outfit_date date,
  is_favorite boolean not null default false,
  preview_image_path text,
  canvas_data jsonb not null default '{"version":1,"width":360,"height":480,"items":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  title text not null,
  notes text,
  source_url text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clothes_user_created_idx on public.clothes(user_id, created_at desc);
create index if not exists clothes_user_last_worn_idx on public.clothes(user_id, last_worn_date desc);
create index if not exists outfits_user_created_idx on public.outfits(user_id, created_at desc);
create index if not exists outfits_user_favorite_idx on public.outfits(user_id, is_favorite) where is_favorite = true;
create index if not exists ideas_user_created_idx on public.ideas(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clothes_set_updated_at on public.clothes;
create trigger clothes_set_updated_at before update on public.clothes
for each row execute function public.set_updated_at();

drop trigger if exists outfits_set_updated_at on public.outfits;
create trigger outfits_set_updated_at before update on public.outfits
for each row execute function public.set_updated_at();

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at before update on public.ideas
for each row execute function public.set_updated_at();

alter table public.clothes enable row level security;
alter table public.outfits enable row level security;
alter table public.ideas enable row level security;

-- Пользователь видит и изменяет только собственные строки.
drop policy if exists "clothes_owner_select" on public.clothes;
create policy "clothes_owner_select" on public.clothes
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "clothes_owner_insert" on public.clothes;
create policy "clothes_owner_insert" on public.clothes
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "clothes_owner_update" on public.clothes;
create policy "clothes_owner_update" on public.clothes
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "clothes_owner_delete" on public.clothes;
create policy "clothes_owner_delete" on public.clothes
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "outfits_owner_select" on public.outfits;
create policy "outfits_owner_select" on public.outfits
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "outfits_owner_insert" on public.outfits;
create policy "outfits_owner_insert" on public.outfits
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "outfits_owner_update" on public.outfits;
create policy "outfits_owner_update" on public.outfits
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "outfits_owner_delete" on public.outfits;
create policy "outfits_owner_delete" on public.outfits
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ideas_owner_select" on public.ideas;
create policy "ideas_owner_select" on public.ideas
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ideas_owner_insert" on public.ideas;
create policy "ideas_owner_insert" on public.ideas
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "ideas_owner_update" on public.ideas;
create policy "ideas_owner_update" on public.ideas
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ideas_owner_delete" on public.ideas;
create policy "ideas_owner_delete" on public.ideas
for delete to authenticated
using ((select auth.uid()) = user_id);

-- Приватный bucket. Путь каждого файла начинается с user_id:
-- <user_id>/clothes/..., <user_id>/outfits/..., <user_id>/ideas/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wardrobe-private',
  'wardrobe-private',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "wardrobe_storage_select" on storage.objects;
create policy "wardrobe_storage_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'wardrobe-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "wardrobe_storage_insert" on storage.objects;
create policy "wardrobe_storage_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'wardrobe-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "wardrobe_storage_update" on storage.objects;
create policy "wardrobe_storage_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'wardrobe-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'wardrobe-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "wardrobe_storage_delete" on storage.objects;
create policy "wardrobe_storage_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'wardrobe-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
