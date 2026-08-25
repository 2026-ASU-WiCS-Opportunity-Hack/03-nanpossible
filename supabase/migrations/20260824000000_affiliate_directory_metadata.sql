-- ============================================================
-- Migration: Affiliate metadata from directory.wial.org
-- Date: 2026-08-24
-- Description:
--   Columns for the extra affiliate data crawled from the official
--   WIAL directory (directory.wial.org/affiliates) by
--   scripts/crawl-wial-affiliates.ts and imported by
--   scripts/import-directory-affiliates.ts:
--     - directory_slug: canonical profile slug on the old directory
--       (e.g. "wial-thailand"); unique so re-imports update in place.
--     - contact_name + postal address parts shown on the profile.
--     - social/blog links.
--   All editable by platform admins via the affiliate settings form
--   (website_url and logo_url already existed).
-- ============================================================

alter table public.chapters
  add column if not exists directory_slug text,
  add column if not exists contact_name text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state_province text,
  add column if not exists postal_code text,
  add column if not exists facebook_url text,
  add column if not exists linkedin_url text,
  add column if not exists youtube_url text,
  add column if not exists blog_url text;

create unique index if not exists chapters_directory_slug_key
  on public.chapters (directory_slug)
  where directory_slug is not null;
