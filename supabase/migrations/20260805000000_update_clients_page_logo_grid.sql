-- ============================================================
-- Migration: Restore the Our Clients logo grid (issue #58)
-- Date: 2026-08-05
-- Description:
--   Replace the text bullet list on the global "clients" page with
--   a logo_grid matching the legacy https://wial.org/our-clients/
--   page. Logos are vendored locally under public/clients/ (no
--   hotlinking of wial.org uploads). Upserts so environments with
--   or without an existing clients row both converge.
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
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0004',
    null,
    'clients',
    'Our Clients',
    true,
    jsonb_build_object(
        'heroIntro', 'These are just some of the organizations that have worked with or continue to work with WIAL to advance the use of Action Learning in the corporate world. Want to see your business on this list? Contact us to find out how you can get involved in the Action Learning community.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Client organizations', 'value', '35+'),
            jsonb_build_object('label', 'Industries served', 'value', '10+'),
            jsonb_build_object('label', 'Years of client work', 'value', '25+')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'logo_grid',
                'title', 'Organizations we''ve worked with',
                'items', jsonb_build_array(
                    jsonb_build_object('name', 'Asian Paints', 'logo', '/clients/asian-paints.png'),
                    jsonb_build_object('name', 'Boeing', 'logo', '/clients/boeing.png'),
                    jsonb_build_object('name', 'Caterpillar', 'logo', '/clients/caterpillar.png'),
                    jsonb_build_object('name', 'DuPont', 'logo', '/clients/dupont.png'),
                    jsonb_build_object('name', 'Emerging World', 'logo', '/clients/emerging-world.png'),
                    jsonb_build_object('name', 'Ernst & Young', 'logo', '/clients/ernst-young.png'),
                    jsonb_build_object('name', 'Fuji Xerox', 'logo', '/clients/fuji-xerox.png'),
                    jsonb_build_object('name', 'Ministry of Education', 'logo', '/clients/ministry-of-education.png'),
                    jsonb_build_object('name', 'NASA', 'logo', '/clients/nasa.png'),
                    jsonb_build_object('name', 'NEC', 'logo', '/clients/nec.png'),
                    jsonb_build_object('name', 'Microsoft', 'logo', '/clients/microsoft.png'),
                    jsonb_build_object('name', 'Samsung', 'logo', '/clients/samsung.png'),
                    jsonb_build_object('name', 'Siemens', 'logo', '/clients/siemens.png'),
                    jsonb_build_object('name', 'SIM', 'logo', '/clients/sim.png'),
                    jsonb_build_object('name', 'Toyota', 'logo', '/clients/toyota.png'),
                    jsonb_build_object('name', 'Workplace Stars', 'logo', '/clients/workplace-stars.png'),
                    jsonb_build_object('name', 'Grenada Red Cross', 'logo', '/clients/grenada-red-cross.png'),
                    jsonb_build_object('name', 'IFRC', 'logo', '/clients/ifrc.png'),
                    jsonb_build_object('name', 'Lyreco', 'logo', '/clients/lyreco.png'),
                    jsonb_build_object('name', 'Satellite Applications Catapult', 'logo', '/clients/satellite-applications-catapult.png'),
                    jsonb_build_object('name', 'Pathfinders Preschool', 'logo', '/clients/pathfinders-preschool.jpg'),
                    jsonb_build_object('name', 'Takeda', 'logo', '/clients/takeda.jpg'),
                    jsonb_build_object('name', 'HR Friday', 'logo', '/clients/hr-friday.png'),
                    jsonb_build_object('name', 'Google', 'logo', '/clients/google.png'),
                    jsonb_build_object('name', 'ThoughtWorks', 'logo', '/clients/thoughtworks.png'),
                    jsonb_build_object('name', 'Aquaecology', 'logo', '/clients/aquaecology.png'),
                    jsonb_build_object('name', 'Thermo Scientific', 'logo', '/clients/thermo-scientific.png'),
                    jsonb_build_object('name', 'FOTIC', 'logo', '/clients/fotic.png'),
                    jsonb_build_object('name', 'Eastern Caribbean Central Bank', 'logo', '/clients/eastern-caribbean-central-bank.png'),
                    jsonb_build_object('name', 'Robinsons Land Corporation', 'logo', '/clients/robinsons-land.png'),
                    jsonb_build_object('name', 'Auchan Retail', 'logo', '/clients/auchan-retail.png'),
                    jsonb_build_object('name', 'MOH Holdings', 'logo', '/clients/moh-holdings.png'),
                    jsonb_build_object('name', 'AirAsia', 'logo', '/clients/airasia.png'),
                    jsonb_build_object('name', 'US Department of Justice', 'logo', '/clients/us-department-of-justice.png'),
                    jsonb_build_object('name', 'Helmgras', 'logo', '/clients/helmgras.png'),
                    jsonb_build_object('name', 'BNP Paribas', 'logo', '/clients/bnp-paribas.jpg')
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Client testimonials',
                'body', 'Hear directly from organizations about their experience working with WIAL.',
                'href', 'https://wial.org/client-testimonials/',
                'label', 'Read testimonials'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Share your success story',
                'body', 'Worked with WIAL and had a great result? Tell us about it.',
                'href', 'https://wial.org/share-your-success-story/',
                'label', 'Share your story'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Ready to bring Action Learning to your organization?',
                'body', 'Use the shared contact route to coordinate a tailored Action Learning program for your team or organization.',
                'href', '/contact',
                'label', 'Talk with WIAL'
            )
        )
    ),
    jsonb_build_object(
        'description', 'Organizations that have worked with WIAL to advance Action Learning worldwide.',
        'sourceUrl', 'https://wial.org/our-clients/',
        'sourceStatus', 'migrated-from-wial',
        'sourceNotes', 'Rewritten from the live wial.org Our Clients page. Client logos vendored locally under public/clients/ (no hotlinking) and rendered as a logo_grid matching the legacy page. Testimonials and Share Your Success Story links kept per issue rows 31-33.'
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
