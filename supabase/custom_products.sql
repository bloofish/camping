create extension if not exists pgcrypto;

create table if not exists public.custom_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text,
  product_id text not null,
  name text not null,
  brand text not null,
  category text not null,
  weight text,
  rarity text default 'common',
  icon text not null,
  image text not null,
  purchase_link text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, product_id)
);

create index if not exists custom_products_user_id_idx on public.custom_products (user_id);

alter table public.custom_products enable row level security;

drop policy if exists "Users can read own custom products" on public.custom_products;
create policy "Users can read own custom products"
on public.custom_products
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own custom products" on public.custom_products;
create policy "Users can insert own custom products"
on public.custom_products
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own custom products" on public.custom_products;
create policy "Users can update own custom products"
on public.custom_products
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('custom-product-images', 'custom-product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view custom product images" on storage.objects;
create policy "Public can view custom product images"
on storage.objects
for select
to public
using (bucket_id = 'custom-product-images');

drop policy if exists "Users can upload own custom product images" on storage.objects;
create policy "Users can upload own custom product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'custom-product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own custom product images" on storage.objects;
create policy "Users can update own custom product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'custom-product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'custom-product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
