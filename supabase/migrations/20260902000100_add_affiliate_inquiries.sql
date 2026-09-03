-- ============================================================
-- Migration: Add affiliate inquiries table
-- Date: 2026-09-02
-- Description:
--   Stores submissions from the /become-an-affiliate form (migrated
--   from the wial.org/become-an-affiliate/ "Interested in becoming an
--   affiliate?" form). Mirrors the contact_messages pattern: public
--   insert, authenticated read.
-- ============================================================

create table if not exists public.affiliate_inquiries (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text,
    organization text,
    country text not null,
    message text,
    created_at timestamptz default now()
);

alter table public.affiliate_inquiries enable row level security;

drop policy if exists "Anyone can insert affiliate inquiries" on public.affiliate_inquiries;
create policy "Anyone can insert affiliate inquiries"
    on public.affiliate_inquiries
    for insert
    to authenticated, anon
    with check (true);

drop policy if exists "Only authenticated users can view affiliate inquiries" on public.affiliate_inquiries;
create policy "Only authenticated users can view affiliate inquiries"
    on public.affiliate_inquiries
    for select
    to authenticated
    using (true);
