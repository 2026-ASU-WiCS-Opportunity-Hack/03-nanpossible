-- Conference pages managed by platform admins (/admin/global/conferences).
--
-- Each conference is an ordinary global content page with the slug
-- `conferences/<slug>` (edited with the same page editor as every other site
-- page) plus one row here holding the facts the site needs in structured
-- form: when and where it is, and whether it has moved to the archive.
-- Deleting the page deletes its conference row.

create table if not exists public.conferences (
    id uuid primary key default gen_random_uuid(),
    page_id uuid not null unique references public.content_pages (id) on delete cascade,
    start_date date,
    end_date date,
    location text,
    archived boolean not null default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint conferences_dates_in_order check (end_date is null or start_date is null or end_date >= start_date)
);

drop trigger if exists conferences_set_updated_at on public.conferences;
create trigger conferences_set_updated_at
before update on public.conferences
for each row execute function public.set_updated_at();

alter table public.conferences enable row level security;

-- Dates and places are public; whether a conference shows at all is decided
-- by its page's `published` flag (content_pages has its own read policy).
-- Writes go through the service role only, so there is no write policy.
drop policy if exists "Conferences are publicly readable" on public.conferences;
create policy "Conferences are publicly readable"
    on public.conferences
    for select
    to anon, authenticated
    using (true);

grant select on public.conferences to anon, authenticated;
grant all on public.conferences to service_role;

-- ------------------------------------------------------------------
-- Seed: the 2026 Tokyo conference becomes its own page, built from the
-- "Coming soon" section of /conferences (same wording). Skipped when the
-- page already exists, so re-running is safe.
-- ------------------------------------------------------------------
insert into public.content_pages (id, chapter_id, slug, title, published, body_richtext, seo)
select
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaac026',
    null,
    'conferences/2026-tokyo',
    'WIAL Global Conference 2026',
    true,
    jsonb_build_object(
        'heroIntro', 'The WIAL Global Conference 2026 takes place October 23–24, 2026 at Shibuya QWS in Tokyo, Japan — marking twenty years since Action Learning arrived in Japan. Under the theme “The Rise of Future-Making Teams,” practitioners and researchers from more than a dozen countries will ask what human teams are for in an era when AI can produce answers.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Theme', 'value', 'The Rise of Future-Making Teams'),
            jsonb_build_object('label', 'Venue', 'value', 'Shibuya QWS')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'About the conference',
                'paragraphs', jsonb_build_array(
                    'The conference runs in person and online, with simultaneous Japanese–English interpretation, hosted with the Japan Action Learning Association (WIAL Japan).'
                ),
                'bullets', jsonb_build_array(
                    'October 23–24, 2026 — Shibuya QWS, Tokyo, Japan',
                    'Theme: The Rise of Future-Making Teams',
                    'In person and online, with Japanese–English interpretation',
                    'Keynotes, case presentations, and live Action Learning sessions from a global speaker lineup'
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Questions about the conference?',
                'body', 'Want to attend, speak, or bring your team to a WIAL conference? Get in touch with the WIAL team.',
                'href', '/contact',
                'label', 'Contact WIAL'
            )
        )
    ),
    jsonb_build_object('description', 'WIAL Global Conference 2026 — October 23–24, 2026 at Shibuya QWS in Tokyo, Japan. Theme: The Rise of Future-Making Teams.')
where not exists (
    select 1 from public.content_pages
    where chapter_id is null and slug = 'conferences/2026-tokyo'
);

insert into public.conferences (page_id, start_date, end_date, location)
select p.id, date '2026-10-23', date '2026-10-24', 'Tokyo, Japan'
from public.content_pages p
where p.chapter_id is null
  and p.slug = 'conferences/2026-tokyo'
  and not exists (select 1 from public.conferences c where c.page_id = p.id);

-- /conferences now lists conferences from the table, so its hand-written
-- "Coming soon: … 2026 in Tokyo" section would repeat the same conference.
-- Only that one section is removed; every other edit to the page is kept.
update public.content_pages
set body_richtext = jsonb_set(
    body_richtext,
    '{sections}',
    coalesce(
        (
            select jsonb_agg(section order by position)
            from jsonb_array_elements(body_richtext -> 'sections') with ordinality as t(section, position)
            where section ->> 'title' is distinct from 'Coming soon: WIAL Global Conference 2026 in Tokyo'
        ),
        '[]'::jsonb
    )
)
where chapter_id is null
  and slug = 'conferences'
  and jsonb_typeof(body_richtext -> 'sections') = 'array';
