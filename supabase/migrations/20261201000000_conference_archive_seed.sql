-- Past conferences become archived conference pages (/admin/global/conferences).
--
-- The nine entries of the hand-written "Past conferences" timeline on
-- /conferences are seeded as archived conferences, with the same wording.
-- The 2024 page also takes over the "2024: Resilient Teams" section. Both
-- sections are then removed from /conferences, where the "Conference
-- archive" grid now lists these pages instead. Existing pages are skipped,
-- so re-running is safe.

do $$
declare
    seed jsonb := $json$[
      {
        "slug": "2024-ho-chi-minh-city",
        "title": "WIAL Global Conference — Ho Chi Minh City, Vietnam",
        "start": "2024-10-25", "end": "2024-10-26",
        "location": "Ho Chi Minh City, Vietnam",
        "theme": "Resilient Teams",
        "intro": "The 2024 WIAL Global Conference was held in Vietnam for the first time, on October 25–26 at the Novotel Saigon Centre in Ho Chi Minh City. Under the theme “Resilient Teams,” the two-day event equipped practitioners, corporate leaders, HR, L&D, and OD professionals, trainers, and coaches with practical strategies for building and sustaining resilient teams.",
        "sections": [
          {
            "type": "prose",
            "title": "About the conference",
            "paragraphs": [
              "The conference was hosted with WIAL Vietnam — WIAL's affiliate since 2015 and Affiliate of the Year 2022 — with bilingual English–Vietnamese interpretation throughout."
            ],
            "bullets": [
              "150 participants — practitioners, corporate leaders, HR, L&D, OD, trainers, and coaches",
              "15+ international keynote and guest speakers",
              "Participants from 12+ countries and 20+ industries"
            ]
          }
        ]
      },
      {
        "slug": "2023-action-learning-week",
        "title": "WIAL Global Action Learning Week",
        "start": "2023-10-23", "end": "2023-10-27",
        "intro": "The annual gathering ran as a week-long global Action Learning event."
      },
      {
        "slug": "2021-global-conference",
        "title": "WIAL Global Conference 2021",
        "start": "2021-09-21", "end": "2021-09-24",
        "intro": "Business leaders, HR, OD, and learning professionals, and Action Learning coaches explored how to solve complex problems, develop leaders, build teams, and grow learning organizations."
      },
      {
        "slug": "2019-sao-paulo",
        "title": "WIAL Global Conference — São Paulo, Brazil",
        "start": "2019-09-26", "end": "2019-09-27",
        "location": "São Paulo, Brazil",
        "theme": "Building a Culture of Innovation and Collaboration through Action Learning",
        "intro": "The 13th annual global conference. Theme: “Building a Culture of Innovation and Collaboration through Action Learning.”"
      },
      {
        "slug": "2018-amsterdam",
        "title": "WIAL Global Conference — Amsterdam, the Netherlands",
        "start": "2018-09-26", "end": "2018-09-27",
        "location": "Amsterdam, the Netherlands",
        "theme": "Action Learning: Fast Track Your Leaders",
        "intro": "The 12th annual global conference. Theme: “Action Learning: Fast Track Your Leaders.”"
      },
      {
        "slug": "2017-shanghai",
        "title": "WIAL Global Conference — Shanghai, China",
        "start": "2017-10-19", "end": "2017-10-20",
        "location": "Shanghai, China",
        "theme": "Transformation through Action Learning",
        "intro": "The 11th annual global conference. Theme: “Transformation through Action Learning.”"
      },
      {
        "slug": "2017-wial-usa-frederick",
        "title": "WIAL-USA Conference — Frederick, Maryland, USA",
        "start": "2017-10-05", "end": null,
        "location": "Frederick, Maryland, USA",
        "theme": "Improving Performance: The Neuroscience of Action Learning",
        "intro": "Theme: “Improving Performance: The Neuroscience of Action Learning.”"
      },
      {
        "slug": "2017-kuala-lumpur",
        "title": "WIAL Regional Conference — Kuala Lumpur, Malaysia",
        "start": "2017-04-06", "end": "2017-04-07",
        "location": "Kuala Lumpur, Malaysia",
        "intro": "A regional conference for the Asia-Pacific Action Learning community."
      },
      {
        "slug": "2016-warsaw",
        "title": "WIAL Global Conference — Warsaw, Poland",
        "start": "2016-10-19", "end": "2016-10-20",
        "location": "Warsaw, Poland",
        "intro": "The 10th annual conference — nearly 100 participants came to learn, network, and experience Action Learning, with workshops on techniques and real-world implementation."
      }
    ]$json$;
    item jsonb;
    new_page_id uuid;
begin
    for item in select * from jsonb_array_elements(seed) loop
        if exists (
            select 1 from public.content_pages
            where chapter_id is null and slug = 'conferences/' || (item ->> 'slug')
        ) then
            continue;
        end if;

        insert into public.content_pages (chapter_id, slug, title, published, body_richtext, seo)
        values (
            null,
            'conferences/' || (item ->> 'slug'),
            item ->> 'title',
            true,
            jsonb_build_object(
                'heroIntro', item ->> 'intro',
                'metrics', case
                    when item ? 'theme'
                        then jsonb_build_array(jsonb_build_object('label', 'Theme', 'value', item ->> 'theme'))
                    else '[]'::jsonb
                end,
                'sections', coalesce(item -> 'sections', '[]'::jsonb)
            ),
            jsonb_build_object('description', item ->> 'intro')
        )
        returning id into new_page_id;

        insert into public.conferences (page_id, start_date, end_date, location, archived)
        values (
            new_page_id,
            (item ->> 'start')::date,
            (item ->> 'end')::date,
            item ->> 'location',
            true
        );
    end loop;
end $$;

-- The archive grid replaces the hand-written timeline and the 2024 recap on
-- /conferences. Only those two sections are removed.
update public.content_pages
set body_richtext = jsonb_set(
    body_richtext,
    '{sections}',
    coalesce(
        (
            select jsonb_agg(section order by position)
            from jsonb_array_elements(body_richtext -> 'sections') with ordinality as t(section, position)
            where not (
                (section ->> 'type' = 'timeline' and section ->> 'title' = 'Past conferences')
                or section ->> 'title' = '2024: Resilient Teams — Ho Chi Minh City, Vietnam'
            )
        ),
        '[]'::jsonb
    )
)
where chapter_id is null
  and slug = 'conferences'
  and jsonb_typeof(body_richtext -> 'sections') = 'array';
