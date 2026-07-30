alter table public.content_pages
  add column if not exists body_json jsonb,
  add column if not exists is_global boolean not null default false,
  add column if not exists language text not null default 'en',
  add column if not exists sort_order int not null default 0,
  add column if not exists ai_generated boolean not null default false,
  add column if not exists audio_url text,
  add column if not exists audio_duration_seconds int,
  add column if not exists audio_generated_at timestamptz;

insert into public.content_pages (
  chapter_id,
  slug,
  title,
  body_html,
  body_richtext,
  seo,
  published,
  body_json,
  is_global,
  language,
  sort_order,
  ai_generated
)
values (
  null,
  'global-footer',
  'Global Footer',
  $footer_html$
    <h2>World Institute for Action Learning</h2>
    <p>A single WIAL platform for consistent chapters, safer content, and faster deployment.</p>
    <h3>Reach WIAL</h3>
    <p>P.O. Box 7601 #83791<br>Washington, DC 20044</p>
    <p><a href="mailto:info@wial.org">info@wial.org</a></p>
    <h3>Canonical Pages</h3>
    <p><a href="/">Home</a></p>
    <p><a href="/about">About WIAL</a></p>
    <p><a href="/certification">Certification</a></p>
    <p><a href="/clients">Our Clients</a></p>
    <p><a href="/contact">Contact</a></p>
  $footer_html$,
  '{}'::jsonb,
  '{
    "description": "Global WIAL footer content.",
    "sourceUrl": "",
    "sourceStatus": "footer-draft",
    "sourceNotes": "The existing hard-coded footer remains live until a platform admin publishes this draft."
  }'::jsonb,
  true,
  $footer_state$
  {
    "draft": {
      "eyebrow": "Shared Chapter Shell",
      "heading": "A single WIAL platform for consistent chapters, safer content, and faster deployment.",
      "description": "This foundation enforces the global layout across chapter sites while leaving room for chapter-specific content and future admin workflows.",
      "contactHeading": "Reach WIAL",
      "address": "P.O. Box 7601 #83791\nWashington, DC 20044",
      "email": "info@wial.org",
      "linksHeading": "Canonical Pages",
      "links": [
        {"id": "home", "label": "Home", "href": "/"},
        {"id": "about", "label": "About WIAL", "href": "/about"},
        {"id": "certification", "label": "Certification", "href": "/certification"},
        {"id": "clients", "label": "Our Clients", "href": "/clients"},
        {"id": "contact", "label": "Contact", "href": "/contact"}
      ],
      "leftLegal": "{siteName} on Next.js, Supabase, Vercel, and Dolt.",
      "rightLegal": "Broken archive links and unsafe legacy pages were intentionally excluded."
    },
    "published": null
  }
  $footer_state$::jsonb,
  true,
  'en',
  1000,
  false
)
on conflict (slug) where chapter_id is null
do update set
  body_json = coalesce(public.content_pages.body_json, excluded.body_json),
  is_global = true,
  updated_at = timezone('utc', now());
