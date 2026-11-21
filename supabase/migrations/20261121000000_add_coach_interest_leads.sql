-- ============================================================
-- Migration: Add coach interest leads table (#161)
-- Description:
--   Stores submissions from the /become-a-coach interest form
--   (restored from wial.org/become-a-coach/). Mirrors the
--   affiliate_inquiries pattern for inserts; reads are service-role only.
-- ============================================================

create table if not exists public.coach_interest_leads (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text,
    country text not null,
    message text not null,
    subscribed_to_newsletter boolean not null default false,
    created_at timestamptz default now()
);

create index if not exists coach_interest_leads_country_idx
    on public.coach_interest_leads (country, created_at desc);

alter table public.coach_interest_leads enable row level security;

drop policy if exists "Anyone can insert coach interest leads" on public.coach_interest_leads;
create policy "Anyone can insert coach interest leads"
    on public.coach_interest_leads
    for insert
    to authenticated, anon
    with check (true);

-- No select policy on purpose: leads hold personal contact details, so they
-- are readable only through the service role (stricter than the older
-- inquiry tables, where any signed-in account can read).
grant insert on public.coach_interest_leads to anon, authenticated;
grant all on public.coach_interest_leads to service_role;
