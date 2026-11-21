-- ============================================================
-- Migration: /about — add Shannon Banks to Directors Emeritus (#182)
--   Appends one card to the "Directors Emeritus" people grid. Only
--   that section's items change, and nothing is added if she is
--   already listed there, so page-editor edits are kept and a re-run
--   is harmless. Her Advisory Board card is left as it is.
-- ============================================================

update public.content_pages
set
    body_richtext = jsonb_set(
        body_richtext,
        '{sections}',
        (
            select jsonb_agg(
                case
                    when section ->> 'type' = 'people_grid'
                        and section ->> 'title' = 'Directors Emeritus'
                        and not (section -> 'items') @> '[{"name": "Shannon Banks"}]'::jsonb
                    then jsonb_set(
                        section,
                        '{items}',
                        (section -> 'items') || jsonb_build_array(
                            jsonb_build_object(
                                'name', 'Shannon Banks',
                                'role', 'Director Emeritus',
                                'image', '/leadership/shannon-banks.jpg'
                            )
                        )
                    )
                    else section
                end
                order by position
            )
            from jsonb_array_elements(body_richtext -> 'sections') with ordinality as t(section, position)
        )
    ),
    updated_at = now()
where slug = 'about'
  and chapter_id is null
  and jsonb_typeof(body_richtext -> 'sections') = 'array'
  and jsonb_array_length(body_richtext -> 'sections') > 0;
