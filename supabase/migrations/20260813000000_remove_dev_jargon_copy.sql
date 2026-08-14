-- Replace website/feature jargon in stored content with copy about the
-- nonprofit itself. Covers the global footer (seeded by 20260724000000) and
-- content pages that mention the tech stack, "shared contact route", or
-- rollout/migration language. Each replacement is guarded so admin-edited
-- text that no longer matches the old copy is left alone.

do $jargon$
declare
  pair text[];
begin
  foreach pair slice 1 in array array[
    array['Shared Chapter Shell', 'World Institute for Action Learning'],
    array['Shared Affiliate Shell', 'World Institute for Action Learning'],
    array['A single WIAL platform for consistent chapters, safer content, and faster deployment.', 'Solving real problems while developing leaders and teams.'],
    array['A single WIAL platform for consistent affiliates, safer content, and faster deployment.', 'Solving real problems while developing leaders and teams.'],
    array['This foundation enforces the global layout across chapter sites while leaving room for chapter-specific content and future admin workflows.', 'WIAL is the global certifying body for Action Learning, supported by a network of affiliates and certified coaches around the world.'],
    array['This foundation enforces the global layout across affiliate sites while leaving room for affiliate-specific content and future admin workflows.', 'WIAL is the global certifying body for Action Learning, supported by a network of affiliates and certified coaches around the world.'],
    array['Canonical Pages', 'Explore'],
    array['{siteName} on Next.js, Supabase, Vercel, and Dolt.', '© World Institute for Action Learning. All rights reserved.'],
    array['Broken archive links and unsafe legacy pages were intentionally excluded.', 'Action Learning will impact the way you work, think, and do business.'],
    array['Need help planning an affiliate rollout?', 'Questions about WIAL or Action Learning?'],
    array['Need help planning a chapter rollout?', 'Questions about WIAL or Action Learning?'],
    array['Use the shared contact route to coordinate certification questions, migration review, and next-step onboarding for affiliate leads.', 'Contact us with certification questions or to learn how to get involved with a WIAL affiliate near you.'],
    array['Use the new shared contact route to coordinate certification questions, migration review, and next-step onboarding for chapter leads.', 'Contact us with certification questions or to learn how to get involved with a WIAL affiliate near you.'],
    array['Use the shared contact route to coordinate a tailored Action Learning program for your team or organization.', 'Contact us to plan a tailored Action Learning program for your team or organization.']
  ] loop
    update public.content_pages
    set
      body_richtext = case
        when body_richtext is not null and position(pair[1] in body_richtext::text) > 0
          then replace(body_richtext::text, pair[1], pair[2])::jsonb
        else body_richtext
      end,
      body_html = case
        when body_html is not null then replace(body_html, pair[1], pair[2])
        else body_html
      end,
      body_json = case
        when body_json is not null and position(pair[1] in body_json::text) > 0
          then replace(body_json::text, pair[1], pair[2])::jsonb
        else body_json
      end,
      updated_at = timezone('utc', now())
    where coalesce(body_richtext::text, '') like '%' || pair[1] || '%'
       or coalesce(body_html, '') like '%' || pair[1] || '%'
       or coalesce(body_json::text, '') like '%' || pair[1] || '%';
  end loop;
end
$jargon$;

-- The seeded WIAL USA tenant pages are platform demos end to end; rewrite them
-- as affiliate content when they still carry the demo copy.
update public.content_pages
set
  body_richtext = $usa_home$
  {
    "heroIntro": "WIAL USA brings Action Learning to organizations across the United States as part of the global WIAL network.",
    "metrics": [
      {"label": "Affiliate", "value": "USA"},
      {"label": "Certification levels", "value": "4"},
      {"label": "Network", "value": "Global"}
    ],
    "sections": [
      {
        "type": "feature_grid",
        "title": "What WIAL USA offers",
        "items": [
          {"eyebrow": "Action Learning", "title": "Solve real problems", "body": "Action Learning helps organizations tackle urgent, real challenges while developing leaders and teams at the same time."},
          {"eyebrow": "Certification", "title": "Globally recognized certification", "body": "WIAL USA follows the same coach certification standards as WIAL affiliates around the world."},
          {"eyebrow": "Coaches", "title": "Certified coaches in the USA", "body": "Connect with WIAL-certified Action Learning coaches based in the United States."}
        ]
      },
      {"type": "cta", "title": "Work with WIAL USA", "body": "Reach the WIAL USA team with questions about Action Learning programs, certification, or coaching.", "href": "/contact", "label": "Contact WIAL USA"}
    ]
  }
  $usa_home$::jsonb,
  body_html = '<header><p>WIAL USA brings Action Learning to organizations across the United States as part of the global WIAL network.</p></header><section><h2>What WIAL USA offers</h2><div><article><h3>Solve real problems</h3><p>Action Learning helps organizations tackle urgent, real challenges while developing leaders and teams at the same time.</p></article><article><h3>Globally recognized certification</h3><p>WIAL USA follows the same coach certification standards as WIAL affiliates around the world.</p></article><article><h3>Certified coaches in the USA</h3><p>Connect with WIAL-certified Action Learning coaches based in the United States.</p></article></div></section><section><h2>Work with WIAL USA</h2><p>Reach the WIAL USA team with questions about Action Learning programs, certification, or coaching.</p><p><a href="/contact">Contact WIAL USA</a></p></section>',
  updated_at = timezone('utc', now())
where chapter_id is not null
  and slug = 'home'
  and body_richtext::text like '%What the USA tenant proves%';

update public.content_pages
set
  body_richtext = $usa_contact$
  {
    "heroIntro": "Get in touch with the WIAL USA team about Action Learning programs, certification, and coaching in the United States.",
    "metrics": [
      {"label": "Affiliate", "value": "WIAL USA"},
      {"label": "Region", "value": "United States"},
      {"label": "Network", "value": "Global WIAL"}
    ],
    "sections": [
      {
        "type": "contact_cards",
        "title": "Contact WIAL USA",
        "items": [
          {"eyebrow": "Email", "title": "WIAL USA inbox", "body": "usa@wial.org", "href": "mailto:usa@wial.org", "label": "Email WIAL USA"},
          {"eyebrow": "How we can help", "title": "Programs and certification", "body": "Action Learning programs\nCoach certification\nTeam coaching"}
        ]
      }
    ]
  }
  $usa_contact$::jsonb,
  body_html = '<header><p>Get in touch with the WIAL USA team about Action Learning programs, certification, and coaching in the United States.</p></header><section><h2>Contact WIAL USA</h2><div><article><h3>WIAL USA inbox</h3><p><a href="mailto:usa@wial.org">usa@wial.org</a></p></article><article><h3>Programs and certification</h3><p>Action Learning programs, coach certification, and team coaching.</p></article></div></section>',
  updated_at = timezone('utc', now())
where chapter_id is not null
  and slug = 'contact'
  and body_richtext::text like '%USA tenant contact details%';
