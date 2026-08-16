-- ============================================================
-- Migration: Add What is Action Learning page
-- Date: 2026-08-15
-- Description:
--   1. Insert Action Learning page (slug: action-learning),
--      migrated from https://wial.org/action-learning/ (issue #81)
--   2. Point the home page "What is Action Learning?" card at
--      /action-learning and the "Search for Action Learning
--      coaches" card at the internal /coaches directory
-- ============================================================

-- ============================================================
-- 1. Insert Action Learning Page
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
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0012',
    null,
    'action-learning',
    'What is Action Learning?',
    true,
    jsonb_build_object(
        'heroIntro', 'Action Learning is a process that involves a small group working on real problems, taking action, and learning as individuals, as a team, and as an organization. It solves problems and develops leaders simultaneously because its simple rules force participants to think critically and work collaboratively.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Team size', 'value', '4-8'),
            jsonb_build_object('label', 'Components', 'value', '6'),
            jsonb_build_object('label', 'Ground rules', 'value', '2')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'Solving problems while developing leaders',
                'paragraphs', jsonb_build_array(
                    'Action Learning is particularly effective for solving complex problems that may appear unsolvable. It elevates the norms, the collaboration, the creativity, and the courage of groups — while each member builds their own leadership, coaching, and problem-solving skills.',
                    'The WIAL model of Action Learning took final form in the renowned six components and two ground rules below, refined through years of testing, research, and practice around the world.'
                )
            ),
            jsonb_build_object(
                'type', 'feature_grid',
                'title', 'The six components of Action Learning',
                'items', jsonb_build_array(
                    jsonb_build_object('eyebrow', 'Component 1', 'title', 'A problem', 'body', 'The problem should be urgent, significant, and the responsibility of the team to resolve.'),
                    jsonb_build_object('eyebrow', 'Component 2', 'title', 'An Action Learning group or team', 'body', 'The team is ideally composed of 4-8 people, ideally with diverse backgrounds and experiences.'),
                    jsonb_build_object('eyebrow', 'Component 3', 'title', 'Insightful questioning and reflective listening', 'body', 'Action Learning tackles problems by first asking questions to clarify the exact nature of the problem, reflecting and identifying possible solutions, and only then taking action.'),
                    jsonb_build_object('eyebrow', 'Component 4', 'title', 'Action taken on the problem', 'body', 'The group must be able to take action on the problem it is working on — members implement the strategies they develop rather than only making recommendations.'),
                    jsonb_build_object('eyebrow', 'Component 5', 'title', 'A commitment to learning', 'body', 'Solving the problem brings immediate benefits, but the greater, longer-term value is the learning gained by each member and the team — and how it is applied across the organization.'),
                    jsonb_build_object('eyebrow', 'Component 6', 'title', 'An Action Learning coach', 'body', 'The coach helps the team reflect on both what they are learning and how they are solving problems.')
                )
            ),
            jsonb_build_object(
                'type', 'prose',
                'title', 'The two ground rules',
                'paragraphs', jsonb_build_array(
                    'Two simple ground rules keep every Action Learning session focused on inquiry and learning:'
                ),
                'bullets', jsonb_build_array(
                    'Statements can only be made in response to questions — and anyone can ask questions of anyone.',
                    'The Action Learning coach has the authority to intervene whenever they see an opportunity for the team to learn.'
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Become a certified Action Learning coach',
                'body', 'WIAL is the world''s leading certifying body for Action Learning. Explore the certification path that fits you.',
                'href', '/certification',
                'label', 'Explore certification'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Find an Action Learning coach',
                'body', 'Search our directory of certified Action Learning coaches around the world.',
                'href', '/coaches',
                'label', 'Find a coach'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'See what Action Learning can do for you',
                'body', 'Explore how Action Learning benefits individuals, teams, and organizations.',
                'href', '/benefits',
                'label', 'See the benefits'
            )
        )
    ),
    jsonb_build_object(
        'description', 'Action Learning is a process where a small group works on real problems, takes action, and learns as individuals, a team, and an organization — built on six components and two ground rules.',
        'sourceUrl', 'https://wial.org/action-learning/',
        'sourceStatus', 'migrated-from-wial',
        'sourceNotes', 'Rewritten from the live wial.org Action Learning page (definition, six components, ground rules). External CTAs replaced with internal /certification, /coaches, and /benefits routes; Solution Spheres blurb omitted until the services page is migrated.'
    ),
    now(),
    now()
);

-- ============================================================
-- 2. Point home page cards at internal routes
-- ============================================================
update public.content_pages
set
    body_richtext = replace(
        replace(
            body_richtext::text,
            '"href": "https://wial.org/action-learning/"',
            '"href": "/action-learning"'
        ),
        '"href": "https://directory.wial.org/"',
        '"href": "/coaches"'
    )::jsonb,
    updated_at = now()
where chapter_id is null
  and slug = 'home'
  and (
    body_richtext::text like '%https://wial.org/action-learning/%'
    or body_richtext::text like '%"https://directory.wial.org/"%'
  );
