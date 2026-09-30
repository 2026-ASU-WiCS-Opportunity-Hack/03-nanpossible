-- #143: in the /clients hero copy, drop "in the corporate world" (WIAL works
-- with public-sector and nonprofit clients too). A targeted update rather than
-- a full page re-seed so live edits to the rest of the page survive.
update content_pages
set body_richtext = jsonb_set(
      body_richtext,
      '{heroIntro}',
      to_jsonb(replace(body_richtext->>'heroIntro', ' in the corporate world', ''))
    ),
    updated_at = now()
where slug = 'clients'
  and chapter_id is null
  and body_richtext->>'heroIntro' like '% in the corporate world%';
