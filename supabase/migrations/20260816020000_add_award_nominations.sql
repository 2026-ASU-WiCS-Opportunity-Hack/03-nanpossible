-- ============================================================
-- Migration: Add award nominations table
-- Date: 2026-08-16
-- Description:
--   Stores submissions from the /awards/nomination form (migrated
--   from the wial.org/award-nomination/ form). Mirrors the
--   contact_messages pattern: public insert, authenticated read.
--   nomination_type is 'third_party' (nominating someone else,
--   nominee fields + consent required) or 'self' (applying for an
--   award directly). The file-upload field from the legacy form is
--   represented as supporting_materials_url.
-- ============================================================

create table if not exists public.award_nominations (
    id uuid primary key default gen_random_uuid(),
    nomination_type text not null check (nomination_type in ('third_party', 'self')),
    award_category text not null,
    name text not null,
    email text not null,
    phone text,
    location text,
    designation text,
    company text,
    company_website text,
    nominee_name text,
    nominee_email text,
    nominee_location text,
    nominee_designation text,
    nominee_company text,
    nominee_website text,
    reason text not null,
    supporting_materials_url text,
    nominee_consent boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.award_nominations enable row level security;

drop policy if exists "Anyone can insert award nominations" on public.award_nominations;
create policy "Anyone can insert award nominations"
    on public.award_nominations
    for insert
    to authenticated, anon
    with check (true);

drop policy if exists "Only authenticated users can view award nominations" on public.award_nominations;
create policy "Only authenticated users can view award nominations"
    on public.award_nominations
    for select
    to authenticated
    using (true);
