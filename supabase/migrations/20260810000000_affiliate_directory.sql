-- ============================================================
-- Migration: Admin-managed affiliate directory (issue #64 follow-up)
-- Date: 2026-08-10
-- Description:
--   1. Add chapters.website_url — when set, the public /affiliates
--      directory (and admin screens) link to the affiliate's own
--      website; when null, links go to the hosted microsite at
--      <subdomain>.<platform domain>.
--   2. Seed the eight legacy WIAL affiliates as chapter rows so the
--      directory (now rendered from chapters, not static content)
--      lists them. Idempotent: conflicts on subdomain only update
--      the directory-facing fields.
-- ============================================================

alter table public.chapters
  add column if not exists website_url text;

insert into public.chapters (
    name,
    subdomain,
    locale,
    status,
    contact_email,
    theme_json,
    tagline,
    region,
    country,
    description,
    website_url
)
values
    ('WIAL USA', 'usa', 'en-US', 'active', 'usa@wial.org', '{}'::jsonb,
     'Action Learning programs, events, and coach certification across the United States.',
     'North America', 'United States',
     'Action Learning programs, events, and coach certification across the United States.',
     'https://wial-usa.org/'),
    ('WIAL Singapore', 'singapore', 'en', 'active', 'info@wial.org', '{}'::jsonb,
     'Action Learning programs, events, and coach certification in Singapore.',
     'Asia Pacific', 'Singapore',
     'Action Learning programs, events, and coach certification in Singapore.',
     'https://www.wial.sg/'),
    ('WIAL Netherlands', 'netherlands', 'en', 'active', 'info@wial.org', '{}'::jsonb,
     'Action Learning programs, events, and coach certification in the Netherlands.',
     'Europe', 'Netherlands',
     'Action Learning programs, events, and coach certification in the Netherlands.',
     'https://wial.nl/'),
    ('WIAL Malaysia', 'malaysia', 'en', 'active', 'info@wial.org', '{}'::jsonb,
     'Action Learning programs, events, and coach certification in Malaysia.',
     'Asia Pacific', 'Malaysia',
     'Action Learning programs, events, and coach certification in Malaysia.',
     'https://wialmalaysia.com/'),
    ('WIAL Vietnam', 'vietnam', 'en', 'active', 'info@wial.org', '{}'::jsonb,
     'Action Learning programs, events, and coach certification in Vietnam.',
     'Asia Pacific', 'Vietnam',
     'Action Learning programs, events, and coach certification in Vietnam.',
     'http://www.wialvietnam.com/'),
    ('WIAL Poland', 'poland', 'en', 'active', 'info@wial.org', '{}'::jsonb,
     'Action Learning programs, events, and coach certification in Poland.',
     'Europe', 'Poland',
     'Action Learning programs, events, and coach certification in Poland.',
     'https://wialpoland.org/'),
    ('WIAL Russia', 'russia', 'en', 'active', 'info@wial.org', '{}'::jsonb,
     'Action Learning programs, events, and coach certification in Russia.',
     'Europe', 'Russia',
     'Action Learning programs, events, and coach certification in Russia.',
     'https://denissanko.com/'),
    ('WIAL Taiwan', 'taiwan', 'en', 'active', 'info@wial.org', '{}'::jsonb,
     'Action Learning programs, events, and coach certification in Taiwan.',
     'Asia Pacific', 'Taiwan',
     'Action Learning programs, events, and coach certification in Taiwan.',
     'http://www.wial.org.tw/')
on conflict (subdomain) do update set
    status = 'active',
    region = coalesce(public.chapters.region, excluded.region),
    country = coalesce(public.chapters.country, excluded.country),
    description = coalesce(public.chapters.description, excluded.description),
    website_url = excluded.website_url,
    updated_at = timezone('utc', now());
