-- ============================================================
-- Migration: homepage clean-up (#175, #181)
--   1. Remove the "At a glance" box: its counts were stale
--      ("4 certification levels", "8 global affiliates") and
--      reviewers found it unhelpful.
--   2. Better World Fund band: add the fund's vision sentence.
--   Only the metrics and that one section body are rewritten, so
--   other homepage edits made in the page editor are kept.
-- ============================================================

update public.content_pages
set
    body_richtext = jsonb_set(
        body_richtext || jsonb_build_object('metrics', jsonb_build_array()),
        '{sections}',
        (
            select jsonb_agg(
                case
                    when section ->> 'type' = 'cta'
                        and section ->> 'href' = '/better-world'
                    then section || jsonb_build_object(
                        'body', 'Established in 2015 to bring Action Learning services to community-based organizations around the world, so we can fulfill our vision of a world where every community has the power to solve its own toughest problems.'
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
  and jsonb_typeof(body_richtext -> 'sections') = 'array'
  and jsonb_array_length(body_richtext -> 'sections') > 0;
