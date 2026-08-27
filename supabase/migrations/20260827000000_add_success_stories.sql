-- ============================================================
-- Migration: Add success_stories table
-- Date: 2026-08-27
-- Description:
--   Stores submissions from the /clients/success-story form
--   (migrated from wial.org/share-your-success-story/). Mirrors
--   the contact_messages / award_nominations pattern: public
--   insert, authenticated read. The legacy company-logo file
--   upload is represented as company_logo_url; the unused
--   Gravity Forms mailing-address block is omitted.
-- ============================================================

create table if not exists public.success_stories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    country text,
    company text,
    title_at_company text,
    industry text,
    program_type text,
    coach_name text,
    success_story text not null,
    key_results text,
    quote text,
    company_logo_url text,
    comment text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.success_stories enable row level security;

drop policy if exists "Anyone can insert success stories" on public.success_stories;
create policy "Anyone can insert success stories"
    on public.success_stories
    for insert
    to authenticated, anon
    with check (true);

drop policy if exists "Only authenticated users can view success stories" on public.success_stories;
create policy "Only authenticated users can view success stories"
    on public.success_stories
    for select
    to authenticated
    using (true);
