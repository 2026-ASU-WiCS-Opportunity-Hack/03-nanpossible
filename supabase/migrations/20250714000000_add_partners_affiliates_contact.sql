-- ============================================================
-- Migration: Add Partners, Affiliates pages, and Contact Messages
-- Date: 2025-07-14
-- Description: 
--   1. Insert Partners page (slug: partners)
--   2. Insert Affiliates page (slug: affiliates)  
--   3. Update Certification page (remove badges/forms)
--   4. Create contact_messages table with RLS
-- ============================================================

-- ============================================================
-- 1. Insert Partners Page
-- ============================================================
insert into public.content_pages (
    id,
    chapter_id,
    slug,
    title,
    published,
    body_richtext,
    seo,
    created_at,
    updated_at
)
values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0008',
    null,
    'partners',
    'Our Partners',
    true,
    jsonb_build_object(
        'heroIntro', 'WIAL works with a global network of partners who share our commitment to advancing Action Learning worldwide.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Global Partners', 'value', '50+'),
            jsonb_build_object('label', 'Countries', 'value', '30+'),
            jsonb_build_object('label', 'Collaborations', 'value', '100+')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'Partner Directory',
                'paragraphs', jsonb_build_array(
                    'Our partners are organizations and institutions that collaborate with WIAL to deliver Action Learning programs, research, and certification worldwide.',
                    'View our complete partner directory at:'
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Browse Partners',
                'body', 'Explore the full directory of WIAL partners and their services',
                'href', 'https://directory.wial.org/partners',
                'label', 'View Directory'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Become a Partner',
                'body', 'Join WIAL''s global network of partners and help advance Action Learning',
                'href', 'https://directory.wial.org/partners/become',
                'label', 'Apply Now'
            )
        )
    ),
    jsonb_build_object(
        'description', 'WIAL''s global network of partners advancing Action Learning worldwide.',
        'sourceUrl', 'https://directory.wial.org/partners',
        'sourceStatus', 'newly-created',
        'sourceNotes', 'Partner directory page with Become a Partner link.'
    ),
    now(),
    now()
);

-- ============================================================
-- 2. Insert Affiliates Page
-- ============================================================
insert into public.content_pages (
    id,
    chapter_id,
    slug,
    title,
    published,
    body_richtext,
    seo,
    created_at,
    updated_at
)
values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0009',
    null,
    'affiliates',
    'Our Affiliates',
    true,
    jsonb_build_object(
        'heroIntro', 'WIAL affiliates are regional organizations that bring Action Learning to communities around the world. Connect with your local affiliate to learn more about programs, events, and certification opportunities.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Global Affiliates', 'value', '8'),
            jsonb_build_object('label', 'Countries', 'value', '8'),
            jsonb_build_object('label', 'Global Reach', 'value', 'Worldwide')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'Find Your Local Affiliate',
                'paragraphs', jsonb_build_array(
                    'WIAL has affiliate organizations across the globe. Each affiliate offers localized programs, events, and certification support in their region.'
                )
            ),
            jsonb_build_object(
                'type', 'logo_grid',
                'title', 'WIAL Affiliates Worldwide',
                'items', jsonb_build_array(
                    jsonb_build_object('name', 'WIAL USA', 'logo', '', 'url', 'https://wial-usa.org/', 'address', ''),
                    jsonb_build_object('name', 'WIAL Singapore', 'logo', '', 'url', 'https://www.wial.sg/', 'address', ''),
                    jsonb_build_object('name', 'WIAL Netherlands', 'logo', '', 'url', 'https://wial.nl/', 'address', ''),
                    jsonb_build_object('name', 'WIAL Malaysia', 'logo', '', 'url', 'https://wialmalaysia.com/', 'address', ''),
                    jsonb_build_object('name', 'WIAL Vietnam', 'logo', '', 'url', 'http://www.wialvietnam.com/', 'address', ''),
                    jsonb_build_object('name', 'WIAL Poland', 'logo', '', 'url', 'https://wialpoland.org/', 'address', ''),
                    jsonb_build_object('name', 'WIAL Russia', 'logo', '', 'url', 'https://denissanko.com/', 'address', ''),
                    jsonb_build_object('name', 'WIAL Taiwan', 'logo', '', 'url', 'http://www.wial.org.tw/', 'address', '')
                )
            )
        )
    ),
    jsonb_build_object(
        'description', 'WIAL affiliates worldwide - find your local Action Learning organization.',
        'sourceUrl', 'https://wial.org/affiliates/',
        'sourceStatus', 'newly-created',
        'sourceNotes', 'List of 8 WIAL affiliates with website links.'
    ),
    now(),
    now()
);

-- ============================================================
-- 3. Update Certification Page (Remove badges and forms)
-- ============================================================
update public.content_pages
set
    body_richtext = jsonb_build_object(
        'heroIntro', 'WIAL offers four levels of certification for Action Learning coaches. Each level represents increasing expertise, experience, and leadership in the Action Learning community.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Certification levels', 'value', '4'),
            jsonb_build_object('label', 'ICF accredited', 'value', 'CCE'),
            jsonb_build_object('label', 'Global recognition', 'value', 'Yes')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'Why Get Certified',
                'paragraphs', jsonb_build_array(
                    'A trained Action Learning coach is a key success factor for Action Learning programs. Professionals can enhance their value through WIAL certification, which is recognized globally.',
                    'WIAL is an ICF-accredited training provider, and our CALC certification is an accredited ICF CCE program.'
                )
            ),
            jsonb_build_object(
                'type', 'feature_grid',
                'title', 'Four Levels of Certification',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'eyebrow', 'CALC',
                        'title', 'Certified Action Learning Coach',
                        'body', 'CALCs can coach Action Learning sessions and form the first formal certification step in the WIAL model.'
                    ),
                    jsonb_build_object(
                        'eyebrow', 'PALC',
                        'title', 'Professional Action Learning Coach',
                        'body', 'PALCs are coaches who have proven their ability and have accumulated meaningful WIAL Action Learning experience.'
                    ),
                    jsonb_build_object(
                        'eyebrow', 'SALC',
                        'title', 'Senior Action Learning Coach',
                        'body', 'SALCs are cleared to lead all WIAL programs and represent a higher level of experience and readiness.'
                    ),
                    jsonb_build_object(
                        'eyebrow', 'MALC',
                        'title', 'Master Action Learning Coach',
                        'body', 'MALCs are thought leaders in the Action Learning community and represent the highest level in the WIAL hierarchy.'
                    )
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Ready to Get Certified?',
                'body', 'Contact us to learn more about WIAL certification programs and find a certification path that''s right for you.',
                'href', '/contact',
                'label', 'Contact Us'
            )
        )
    ),
    seo = jsonb_build_object(
        'description', 'WIAL certification programs - CALC, PALC, SALC, and MALC certification for Action Learning coaches.',
        'sourceUrl', 'https://wial.org/certification/',
        'sourceStatus', 'updated',
        'sourceNotes', 'Updated: Removed digital badges, Credly references, and downloadable forms. Kept certification levels and ICF accreditation.'
    ),
    updated_at = now()
where slug = 'certification';

-- ============================================================
-- 4. Create Contact Messages Table
-- ============================================================
create table if not exists public.contact_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    message text not null,
    subscribed_to_newsletter boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.contact_messages enable row level security;

-- Create policy for inserting (anyone can insert)
drop policy if exists "Anyone can insert contact messages" on public.contact_messages;
create policy "Anyone can insert contact messages" 
    on public.contact_messages 
    for insert 
    to authenticated, anon 
    with check (true);

-- Create policy for viewing (only authenticated users can view)
drop policy if exists "Only authenticated users can view contact messages" on public.contact_messages;
create policy "Only authenticated users can view contact messages" 
    on public.contact_messages 
    for select 
    to authenticated 
    using (true);

-- ============================================================
-- 5. Verification queries (commented out, uncomment to test)
-- ============================================================
-- select slug, title from public.content_pages where slug in ('partners', 'affiliates');
-- select slug, title, body_richtext->>'heroIntro' from public.content_pages where slug = 'certification';
-- select exists (select from information_schema.tables where table_name = 'contact_messages');