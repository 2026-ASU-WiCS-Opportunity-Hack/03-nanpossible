-- ============================================================
-- Migration: Add Action Learning Benefits page
-- Date: 2026-07-31
-- Description:
--   1. Insert Benefits page (slug: benefits), migrated from
--      https://wial.org/action-learning/benefits/
--   2. Point the home page "Benefits" feature card at /benefits
--      instead of the external wial.org URL
-- ============================================================

-- ============================================================
-- 1. Insert Benefits Page
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
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0010',
    null,
    'benefits',
    'Action Learning Benefits',
    true,
    jsonb_build_object(
        'heroIntro', 'Action Learning helps organizations solve urgent problems, build high-performing teams, and develop leaders — all at the same time. See how individuals, teams, and organizations get more out of their business with WIAL.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Benefit areas', 'value', '5'),
            jsonb_build_object('label', 'Learning Organization systems', 'value', '5'),
            jsonb_build_object('label', 'Global reach', 'value', 'Worldwide')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'Breakthrough problem solving',
                'paragraphs', jsonb_build_array(
                    'We help organizations boost business performance, achieve a substantial return on investment, and improve capability. Action Learning helps teams identify the core issue behind a problem, explore solutions they may not have considered, and move forward when decisions have stalled — so they arrive at the best possible resolution.'
                )
            ),
            jsonb_build_object(
                'type', 'prose',
                'title', 'Becoming a learning organization',
                'paragraphs', jsonb_build_array(
                    'In a competitive environment, organizations must continually learn and improve. WIAL developed a Learning Organization model built on five interlocking systems — Learning, Organization, People, Knowledge, and Technology — along with an assessment instrument to measure where your organization stands.',
                    'The model has been successfully implemented at organizations including Boeing, Accenture, Samsung, Federal Express, and Alcoa.'
                )
            ),
            jsonb_build_object(
                'type', 'prose',
                'title', 'High-performing teams',
                'paragraphs', jsonb_build_array(
                    'Action Learning develops powerful work teams that get up to speed quickly, with strong norms and cohesiveness. Teams improve their problem-solving capability with every session, build shared commitment to results, and encourage breakthrough thinking. Companies such as Microsoft, Samsung, and Siemens use Action Learning to build their teams.'
                )
            ),
            jsonb_build_object(
                'type', 'prose',
                'title', 'Leadership development',
                'paragraphs', jsonb_build_array(
                    'WIAL integrates Action Learning into your existing leadership development programs with minimal restructuring. The process builds your team''s capacity to resolve complex challenges while developing the management skills leaders need for the 21st century.'
                )
            ),
            jsonb_build_object(
                'type', 'prose',
                'title', 'Community impact',
                'paragraphs', jsonb_build_array(
                    'WIAL helps create a better world by supporting organizations that make a positive social impact — providing pro-bono coaching and grant funding for nonprofits and social enterprises.'
                )
            ),
            jsonb_build_object(
                'type', 'prose',
                'title', 'Challenging the status quo',
                'paragraphs', jsonb_build_array(
                    'Across all of these areas, the Action Learning process delivers:'
                ),
                'bullets', jsonb_build_array(
                    'Lasting behavior change',
                    'Essential leadership skills',
                    'High-performance teams',
                    'Capability development at every level of the organization',
                    'A closed gap between knowing and doing',
                    'Stronger learning and problem-solving skills'
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Become an Action Learning Coach',
                'body', 'Explore WIAL certification and start your journey as an Action Learning coach.',
                'href', '/certification',
                'label', 'Explore certification'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Hire an Action Learning Coach',
                'body', 'Find a WIAL-certified coach to bring Action Learning to your organization.',
                'href', '/coaches',
                'label', 'Find a coach'
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Ready to see these benefits in your organization?',
                'body', 'Use the shared contact route to coordinate a tailored Action Learning program for your team or organization.',
                'href', '/contact',
                'label', 'Talk with WIAL'
            )
        )
    ),
    jsonb_build_object(
        'description', 'How Action Learning benefits individuals, teams, and organizations — problem solving, learning organizations, high-performing teams, leadership development, and community impact.',
        'sourceUrl', 'https://wial.org/action-learning/benefits/',
        'sourceStatus', 'migrated-from-wial',
        'sourceNotes', 'Rewritten from the live wial.org Action Learning Benefits page (breakthrough problem solving, learning organization, high-performing teams, leadership development, community impact, challenging the status quo). External wial.org CTAs replaced with internal /certification, /coaches, and /contact routes.'
    ),
    now(),
    now()
);

-- ============================================================
-- 2. Point home page "Benefits" card at the new internal route
-- ============================================================
update public.content_pages
set
    body_richtext = replace(
        body_richtext::text,
        '"href": "https://wial.org/benefits/"',
        '"href": "/benefits"'
    )::jsonb,
    updated_at = now()
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001'
  and chapter_id is null
  and slug = 'home';
