-- ============================================================
-- Migration: Add Better World Fund page
-- Date: 2026-08-14
-- Description:
--   1. Insert consolidated Better World page (slug: better-world),
--      migrated from https://wial.org/better-world-fund/,
--      https://wial.org/wial-gives-back/, and story summaries from
--      https://wial.org/projects/
--   2. Point the home and about page "Better World Fund" CTAs at
--      /better-world instead of the external wial.org URL
-- ============================================================

-- ============================================================
-- 1. Insert Better World Page
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
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0011',
    null,
    'better-world',
    'WIAL Better World Fund',
    true,
    jsonb_build_object(
        'heroIntro', 'WIAL helps to create a better world by supporting organizations that make a positive social impact. In 2015, WIAL established the Better World Fund to provide Action Learning services to community-based organizations around the world — together we can make a difference.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Fund established', 'value', '2015'),
            jsonb_build_object('label', 'Donation impact', 'value', '100x'),
            jsonb_build_object('label', 'Community projects', 'value', '10+')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'Together we can make a difference',
                'paragraphs', jsonb_build_array(
                    'The Better World Fund delivers Action Learning coaching and grant support to community-based organizations around the world — nonprofits, social enterprises, and public agencies working on problems that matter.',
                    'Every dollar contributed to the Better World Fund is multiplied 100-fold through:'
                ),
                'bullets', jsonb_build_array(
                    'The powerful impact of Action Learning itself',
                    'The reduced fees and pro bono services contributed by WIAL coaches',
                    'The in-kind contributions of participating organizations'
                )
            ),
            jsonb_build_object(
                'type', 'feature_grid',
                'title', 'How your contribution helps',
                'items', jsonb_build_array(
                    jsonb_build_object('eyebrow', '$25', 'title', 'Coach learning package', 'body', 'Provides the learning package for training one Action Learning coach.'),
                    jsonb_build_object('eyebrow', '$50', 'title', 'Two coach learning packages', 'body', 'Provides learning packages for training two Action Learning coaches.'),
                    jsonb_build_object('eyebrow', '$100', 'title', 'Partial training scholarship', 'body', 'A partial scholarship toward four days of Action Learning training.'),
                    jsonb_build_object('eyebrow', '$250', 'title', 'Conference scholarship', 'body', 'Sends one community leader to the WIAL Global Conference.'),
                    jsonb_build_object('eyebrow', '$500', 'title', 'Full training scholarship', 'body', 'A full scholarship covering four days of Action Learning training.'),
                    jsonb_build_object('eyebrow', '$1,000', 'title', 'Team scholarship', 'body', 'A full scholarship for training an entire Action Learning team.'),
                    jsonb_build_object('eyebrow', '$2,000', 'title', 'Named four-day program', 'body', 'Funds a four-day Action Learning program designated in the donor''s name.'),
                    jsonb_build_object('eyebrow', '$5,000', 'title', 'Community or national program', 'body', 'Funds an Action Learning program serving an entire community or national organization.')
                )
            ),
            jsonb_build_object(
                'type', 'prose',
                'title', 'WIAL Gives Back',
                'paragraphs', jsonb_build_array(
                    'WIAL believes Action Learning is a great way to develop individuals, teams, and organizations — and to create a better world. Through WIAL Gives Back, Action Learning coaches around the world offer their coaching skills pro bono to organizations in need of help.',
                    'From May 2020 until April 2021, WIAL matched volunteer coaches with organizations, large and small, working to emerge from the COVID-19 pandemic stronger and more resilient. The projects below grew out of that initiative and the Better World Fund''s ongoing work.'
                )
            ),
            jsonb_build_object(
                'type', 'feature_grid',
                'title', 'Better World stories',
                'items', jsonb_build_array(
                    jsonb_build_object('eyebrow', 'Global', 'title', 'International Federation of Red Cross', 'body', 'WIAL and IFRC leaders share the stories, successes, and future hopes of their Action Learning partnership.', 'href', 'https://wial.org/projects/partnership-world-institute-action-learning-international-federation-red-cross/', 'label', 'Read the story'),
                    jsonb_build_object('eyebrow', 'Thailand', 'title', 'Hospital Administration Association', 'body', 'Hospital administrators used Action Learning to address complex problems in healthcare management.', 'href', 'https://wial.org/projects/wial-gives-back-thailand-hospital-administration-association/', 'label', 'Read the story'),
                    jsonb_build_object('eyebrow', 'Thailand', 'title', 'Entrepreneurship Club', 'body', 'Nearly 40 Thai entrepreneurs discovered Action Learning for problem-solving and leadership development.', 'href', 'https://wial.org/projects/wial-gives-back-supports-thailand-entrepreneurship-club/', 'label', 'Read the story'),
                    jsonb_build_object('eyebrow', 'Grenada', 'title', 'Grenada Red Cross', 'body', 'Red Cross teams created breakthrough solutions to complex problems through Action Learning.', 'href', 'https://wial.org/projects/grenada-red-cross-discovers-power-wial-action-learning/', 'label', 'Read the story'),
                    jsonb_build_object('eyebrow', 'Malaysia', 'title', 'We The Protector', 'body', 'Be My Protector Malaysia joined WIAL Gives Back to explore Action Learning on its toughest challenges.', 'href', 'https://wial.org/projects/wial-gives-back-protector/', 'label', 'Read the story'),
                    jsonb_build_object('eyebrow', 'Singapore', 'title', 'Centre for Non-Profit Leadership', 'body', 'Certified coaches supported nine nonprofits and more than 50 team members pro bono.', 'href', 'https://wial.org/projects/wial-gives-back-supports-singapores-centre-non-profit-leadership/', 'label', 'Read the story'),
                    jsonb_build_object('eyebrow', 'Singapore', 'title', 'Singapore Book Council', 'body', 'The independent literary arts charity''s team benefited from learning WIAL''s Action Learning process.', 'href', 'https://wial.org/projects/singapore-book-council-team-benefited-learning-wials-process/', 'label', 'Read the story'),
                    jsonb_build_object('eyebrow', 'Singapore', 'title', 'Singapore Association for the Deaf', 'body', 'Pro bono Action Learning coaching for the agency advocating equal opportunity for the deaf community.', 'href', 'https://wial.org/projects/wial-provides-action-learning-coaching-singapore-association-deaf/', 'label', 'Read the story')
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Donate to the Better World Fund',
                'body', 'Every contribution is multiplied through pro bono coaching and in-kind support — and goes directly to bringing Action Learning to community organizations.',
                'href', 'https://wial.org/wial-better-world-fund-donation/',
                'label', 'Donate'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Nominate an organization',
                'body', 'Know a community organization that could benefit from Action Learning? Nominate it for Better World Fund support.',
                'href', 'https://wial.org/wial-better-world-fund-application/',
                'label', 'Nominate'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Share your Better World story',
                'body', 'Have a pro bono Action Learning story to tell? We want to hear what you have to say.',
                'href', '/contact',
                'label', 'Share your story'
            )
        )
    ),
    jsonb_build_object(
        'description', 'The WIAL Better World Fund provides Action Learning coaching and grant support to community-based organizations around the world.',
        'sourceUrl', 'https://wial.org/better-world-fund/',
        'sourceStatus', 'migrated-from-wial',
        'sourceNotes', 'Consolidated from wial.org better-world-fund, wial-gives-back, and projects (story summaries) per the crawler sheet''s ''links on the About page'' instruction. Donate and Nominate CTAs intentionally still point to the live wial.org forms; individual story pages are not migrated and link to the originals.'
    ),
    now(),
    now()
);

-- ============================================================
-- 2. Point home and about "Better World Fund" CTAs at /better-world
-- ============================================================
update public.content_pages
set
    body_richtext = replace(
        body_richtext::text,
        '"href": "https://wial.org/better-world-fund/"',
        '"href": "/better-world"'
    )::jsonb,
    updated_at = now()
where chapter_id is null
  and slug in ('home', 'about')
  and body_richtext::text like '%https://wial.org/better-world-fund/%';
