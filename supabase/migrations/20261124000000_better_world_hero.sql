-- ============================================================
-- Migration: /better-world hero (#176)
--   Better World Fund review, 19 Oct 2026:
--   1. New hero intro supplied by the fund's reviewers.
--   2. Hero buttons become "Nominate an organization" and
--      "Donate to Better World Fund" (were the default
--      "Contact WIAL" / "View our clients").
--   3. The "At a glance" box is removed (empty metrics).
--   Only these three keys are rewritten, so section edits made in the
--   page editor are kept.
-- ============================================================

update public.content_pages
set
    body_richtext = body_richtext || jsonb_build_object(
        'heroIntro', 'WIAL envisions a world where every community has the power to solve its own toughest problems. In 2015, WIAL established the Better World Fund to provide Action Learning grants to community-based organizations around the world.',
        'heroCtas', jsonb_build_array(
            jsonb_build_object('label', 'Nominate an organization', 'href', '/better-world/nominate', 'variant', 'primary'),
            jsonb_build_object('label', 'Donate to Better World Fund', 'href', '/better-world/donate', 'variant', 'secondary')
        ),
        'metrics', jsonb_build_array()
    ),
    updated_at = now()
where slug = 'better-world'
  and chapter_id is null;
