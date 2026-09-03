-- ============================================================
-- Migration: Library items + resource-files bucket
-- Date: 2026-09-02
-- Description:
--   Catalog for the /resources page, migrated from the wial.org Library
--   (books, videos & podcasts, posters & infographics, articles). Rows are
--   written by scripts/import-library.ts (service role), which also re-hosts
--   every PDF / MP3 / poster image and thumbnail into the public
--   `resource-files` bucket so nothing is hotlinked from wial.org.
--   file_path / thumbnail_path are object paths inside that bucket.
-- ============================================================

create table if not exists public.library_items (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    kind text not null check (kind in ('article', 'book', 'video', 'podcast', 'poster', 'infographic')),
    title text not null,
    summary text,
    published_on date,
    source_url text,
    external_url text,
    file_path text,
    file_type text,
    thumbnail_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists library_items_kind_published_idx
    on public.library_items (kind, published_on desc);

alter table public.library_items enable row level security;

drop policy if exists "Library items are publicly readable" on public.library_items;
create policy "Library items are publicly readable"
    on public.library_items
    for select
    to anon, authenticated
    using (true);

grant select on public.library_items to anon, authenticated;
grant all on public.library_items to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resource-files',
  'resource-files',
  true,
  104857600,
  array['application/pdf', 'audio/mpeg', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Resource files are publicly readable" on storage.objects;
create policy "Resource files are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'resource-files');
