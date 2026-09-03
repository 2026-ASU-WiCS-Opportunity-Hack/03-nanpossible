-- ============================================================
-- Migration: Add better_world_applications table
-- Date: 2026-09-02
-- Description:
--   Stores submissions from the /better-world/nominate form
--   (migrated from wial.org/wial-better-world-fund-application/'s
--   WPForms "WIAL Better World Fund Organizational Funding
--   Application"). Mirrors the affiliate_inquiries /
--   partner_applications pattern: public insert, authenticated
--   read. The legacy form had no mailing-address block or file
--   upload; a consent checkbox was added.
-- ============================================================

create table if not exists public.better_world_applications (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    role text,
    organization_name text not null,
    organization_website text,
    country text,
    organization_type text,
    registered_nonprofit text,
    years_in_operation text,
    affiliate_type text,
    mission text not null,
    urgent_need text not null,
    support_requested text,
    how_it_would_help text not null,
    other_funding text,
    funding_needed text,
    additional_info text,
    consent boolean not null default false,
    created_at timestamptz default now()
);

alter table public.better_world_applications enable row level security;

drop policy if exists "Anyone can insert better world applications" on public.better_world_applications;
create policy "Anyone can insert better world applications"
    on public.better_world_applications
    for insert
    to authenticated, anon
    with check (true);

drop policy if exists "Only authenticated users can view better world applications" on public.better_world_applications;
create policy "Only authenticated users can view better world applications"
    on public.better_world_applications
    for select
    to authenticated
    using (true);

grant insert on public.better_world_applications to anon, authenticated;
grant select on public.better_world_applications to authenticated;
grant all on public.better_world_applications to service_role;
