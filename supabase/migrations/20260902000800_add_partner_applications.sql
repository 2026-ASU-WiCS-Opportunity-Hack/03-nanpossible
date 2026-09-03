-- ============================================================
-- Migration: Add partner_applications table
-- Date: 2026-09-02
-- Description:
--   Stores submissions from the /partners/apply form (migrated
--   from wial.org/become-a-partner/'s inline inquiry form, merged
--   with the fields from its dead-linked, archived "WIAL Partner
--   Application" — business/contact name, email, phone, country,
--   organization description). Mirrors the affiliate_inquiries /
--   success_stories pattern: public insert, authenticated read.
--   The legacy mailing-address block (address lines, city,
--   state/province) and WPForms honeypot field are omitted.
-- ============================================================

create table if not exists public.partner_applications (
    id uuid primary key default gen_random_uuid(),
    organization_name text not null,
    contact_name text not null,
    email text not null,
    phone text,
    website text,
    country text,
    organization_type text,
    message text not null,
    created_at timestamptz default now()
);

alter table public.partner_applications enable row level security;

drop policy if exists "Anyone can insert partner applications" on public.partner_applications;
create policy "Anyone can insert partner applications"
    on public.partner_applications
    for insert
    to authenticated, anon
    with check (true);

drop policy if exists "Only authenticated users can view partner applications" on public.partner_applications;
create policy "Only authenticated users can view partner applications"
    on public.partner_applications
    for select
    to authenticated
    using (true);

grant insert on public.partner_applications to anon, authenticated;
grant select on public.partner_applications to authenticated;
grant all on public.partner_applications to service_role;
