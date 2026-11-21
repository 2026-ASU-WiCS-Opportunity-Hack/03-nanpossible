-- #162: /our-services and /benefits now redirect to /for-organizations, so the
-- links on the global home and action-learning pages point there directly.
-- A targeted text replace (rather than re-seeding the rows) keeps any edits
-- made live in the admin editor. A no-op when nothing matches.
update public.content_pages
set body_richtext = replace(
      replace(body_richtext::text, '"href": "/our-services"', '"href": "/for-organizations"'),
      '"href": "/benefits"', '"href": "/for-organizations"'
    )::jsonb
where chapter_id is null
  and slug in ('home', 'action-learning')
  and (body_richtext::text like '%"href": "/our-services"%'
    or body_richtext::text like '%"href": "/benefits"%');
