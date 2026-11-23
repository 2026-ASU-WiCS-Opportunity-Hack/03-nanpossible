-- ============================================================
-- Migration: point "find a coach / affiliate" links at the
--   official WIAL directory instead of the retired /coaches page.
--   Only the link targets (and the one become-an-affiliate CTA's
--   wording) change, so page-editor edits are kept; a re-run finds
--   nothing left to replace.
-- ============================================================

-- become-an-affiliate CTA: it promised a map of affiliates and coaches.
update public.content_pages
set body_richtext = replace(
        replace(
            body_richtext::text,
            'The coach directory shows every current affiliate on the map alongside the certified coaches based there.',
            'The WIAL directory lists every current affiliate and the region it serves.'
        ),
        'Browse affiliates and coaches',
        'Browse WIAL affiliates'
    )::jsonb,
    body_html = replace(
        replace(
            body_html,
            'The coach directory shows every current affiliate on the map alongside the certified coaches based there.',
            'The WIAL directory lists every current affiliate and the region it serves.'
        ),
        'Browse affiliates and coaches',
        'Browse WIAL affiliates'
    )
where slug = 'become-an-affiliate'
  and chapter_id is null;

-- Affiliate-finding links (home "Find your affiliate", become-an-affiliate).
update public.content_pages
set body_richtext = replace(
        body_richtext::text,
        '"/coaches"',
        '"https://directory.wial.org/affiliates"'
    )::jsonb,
    body_html = replace(body_html, 'href="/coaches"', 'href="https://directory.wial.org/affiliates"')
where slug in ('home', 'become-an-affiliate')
  and chapter_id is null
  and (body_richtext::text like '%"/coaches"%' or body_html like '%href="/coaches"%');

-- Every other global page: "Find a coach" links.
update public.content_pages
set body_richtext = replace(
        body_richtext::text,
        '"/coaches"',
        '"https://directory.wial.org/coaches"'
    )::jsonb,
    body_html = replace(body_html, 'href="/coaches"', 'href="https://directory.wial.org/coaches"')
where slug not in ('home', 'become-an-affiliate')
  and chapter_id is null
  and (body_richtext::text like '%"/coaches"%' or body_html like '%href="/coaches"%');
