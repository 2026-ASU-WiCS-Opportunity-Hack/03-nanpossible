-- ============================================================
-- Migration: Inline newsletter capture (#164)
--   1. newsletter_subscribers keeps every signup made on the site, so
--      none is lost if the Constant Contact sync is unavailable.
--      Written and read only through the service role (RLS on, no
--      policies): rows are personal data.
--   2. The homepage "Join our newsletter" card that linked off-site to
--      Constant Contact becomes an inline newsletter_signup section.
--      Only that one section is rewritten, so other homepage edits made
--      in the page editor are kept.
-- ============================================================

create table if not exists public.newsletter_subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    source text not null default 'footer',
    created_at timestamptz not null default now(),
    synced_at timestamptz,
    sync_error text,
    constraint newsletter_subscribers_email_key unique (email),
    constraint newsletter_subscribers_email_lower check (email = lower(email))
);

alter table public.newsletter_subscribers enable row level security;

revoke all on public.newsletter_subscribers from anon, authenticated;
grant all on public.newsletter_subscribers to service_role;

update public.content_pages
set
    body_richtext = jsonb_set(
        body_richtext,
        '{sections}',
        (
            select jsonb_agg(
                case
                    when section ->> 'type' = 'cta'
                        and section ->> 'href' like '%constantcontact.com%'
                    then jsonb_build_object(
                        'type', 'newsletter_signup',
                        'title', 'Join our newsletter',
                        'body', 'Get Action Learning insights, events and certification dates.'
                    )
                    else section
                end
                order by position
            )
            from jsonb_array_elements(body_richtext -> 'sections') with ordinality as t(section, position)
        )
    ),
    updated_at = now()
where slug = 'home'
  and chapter_id is null
  and exists (
      select 1
      from jsonb_array_elements(body_richtext -> 'sections') as section
      where section ->> 'type' = 'cta'
        and section ->> 'href' like '%constantcontact.com%'
  );
