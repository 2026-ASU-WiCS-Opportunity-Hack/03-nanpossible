-- ============================================================
-- Migration: Affiliate cards with flags and website links (issue #64)
-- Date: 2026-08-09
-- Description:
--   The affiliates page row still carried a logo_grid section with
--   empty logos and url/address keys the renderer ignores, so the
--   live page showed no links. Replace it with contact_cards: each
--   affiliate shows its country flag (SVG vendored under
--   public/flags/) and links to the affiliate website from issue
--   #64. Upserts so environments with or without an existing
--   affiliates row both converge.
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
            jsonb_build_object('label', 'Global affiliates', 'value', '8'),
            jsonb_build_object('label', 'Countries', 'value', '8'),
            jsonb_build_object('label', 'Global reach', 'value', 'Worldwide')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'Find your local affiliate',
                'paragraphs', jsonb_build_array(
                    'WIAL has affiliate organizations across the globe. Each affiliate offers localized programs, events, and certification support in their region.'
                )
            ),
            jsonb_build_object(
                'type', 'contact_cards',
                'title', 'WIAL affiliates worldwide',
                'items', jsonb_build_array(
                    jsonb_build_object('eyebrow', 'USA', 'title', 'WIAL USA', 'body', 'Action Learning programs, events, and coach certification across the United States.', 'href', 'https://wial-usa.org/', 'label', 'Visit website', 'image', '/flags/us.svg', 'imageAlt', 'Flag of the United States'),
                    jsonb_build_object('eyebrow', 'Singapore', 'title', 'WIAL Singapore', 'body', 'Action Learning programs, events, and coach certification in Singapore.', 'href', 'https://www.wial.sg/', 'label', 'Visit website', 'image', '/flags/sg.svg', 'imageAlt', 'Flag of Singapore'),
                    jsonb_build_object('eyebrow', 'Netherlands', 'title', 'WIAL Netherlands', 'body', 'Action Learning programs, events, and coach certification in the Netherlands.', 'href', 'https://wial.nl/', 'label', 'Visit website', 'image', '/flags/nl.svg', 'imageAlt', 'Flag of the Netherlands'),
                    jsonb_build_object('eyebrow', 'Malaysia', 'title', 'WIAL Malaysia', 'body', 'Action Learning programs, events, and coach certification in Malaysia.', 'href', 'https://wialmalaysia.com/', 'label', 'Visit website', 'image', '/flags/my.svg', 'imageAlt', 'Flag of Malaysia'),
                    jsonb_build_object('eyebrow', 'Vietnam', 'title', 'WIAL Vietnam', 'body', 'Action Learning programs, events, and coach certification in Vietnam.', 'href', 'http://www.wialvietnam.com/', 'label', 'Visit website', 'image', '/flags/vn.svg', 'imageAlt', 'Flag of Vietnam'),
                    jsonb_build_object('eyebrow', 'Poland', 'title', 'WIAL Poland', 'body', 'Action Learning programs, events, and coach certification in Poland.', 'href', 'https://wialpoland.org/', 'label', 'Visit website', 'image', '/flags/pl.svg', 'imageAlt', 'Flag of Poland'),
                    jsonb_build_object('eyebrow', 'Russia', 'title', 'WIAL Russia', 'body', 'Action Learning programs, events, and coach certification in Russia.', 'href', 'https://denissanko.com/', 'label', 'Visit website', 'image', '/flags/ru.svg', 'imageAlt', 'Flag of Russia'),
                    jsonb_build_object('eyebrow', 'Taiwan', 'title', 'WIAL Taiwan', 'body', 'Action Learning programs, events, and coach certification in Taiwan.', 'href', 'http://www.wial.org.tw/', 'label', 'Visit website', 'image', '/flags/tw.svg', 'imageAlt', 'Flag of Taiwan')
                )
            )
        )
    ),
    jsonb_build_object(
        'description', 'WIAL affiliates worldwide - find your local Action Learning organization.',
        'sourceUrl', 'https://wial.org/affiliates/',
        'sourceStatus', 'newly-created',
        'sourceNotes', 'Each affiliate card shows its country flag (SVG vendored under public/flags/, from the MIT-licensed flag-icons set) and links to the affiliate website listed in issue #64. New affiliates should be added here with the website URL captured during affiliate creation.'
    ),
    now(),
    now()
)
on conflict (slug) where chapter_id is null
do update set
    title = excluded.title,
    published = excluded.published,
    body_richtext = excluded.body_richtext,
    seo = excluded.seo,
    updated_at = now();
