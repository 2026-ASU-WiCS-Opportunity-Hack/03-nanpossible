# WIAL content migration playbook

How we move pages from the legacy WordPress site (wial.org) into this platform. Written after migrating `/about` (leadership consolidation), `/awards` (three pages merged), `/awards/nomination` (form), `/better-world`, `/action-learning`, `/our-services`, `/benefits`, `/clients`, and `/conferences` (three pages merged, incl. slide transcription). Follow this for every remaining page.

## Goal

Retire wial.org page by page. Every migrated page must:

1. Live on an internal route with the content fully owned by this repo (fixtures + DB), not fetched or hotlinked from wial.org.
2. Redirect all legacy wial.org paths that covered the same content.
3. Keep CTAs on internal routes (`/certification`, `/coaches`, `/contact`, …). A link may stay external only when it is a deliberate decision (a live form or page we have not migrated yet) and the reason is recorded in the page's `seo.sourceNotes`.
4. Read as one page, not a paste-up: consolidate sibling wial.org pages into a single well-structured page when they cover one topic (leadership pages → `/about`; awards + nomination criteria + past winners → `/awards`).

## The four-touch pattern (content pages)

Adding or changing a canonical page always means touching:

1. **`src/content/pages.json`** — the fixture entry (the app falls back to this when the DB is unavailable, so it must always match the DB).
2. **`supabase/migrations/<timestamp>_<name>.sql`** — an upsert of the same content. Generate it, don't hand-write it: `python3 scripts/generate-page-migration.py <slug> <outfile>` reads the pages.json entry and emits the SQL, so fixture and DB cannot drift. Re-run it whenever you edit the page entry before the migration has shipped.
3. **`CanonicalPageSlug`** in `src/lib/types.ts`.
4. **`canonicalMap`** (new slug) and **`aliasMap`** (every old wial.org path → new route) in `src/lib/routing.ts`, with cases added to `src/lib/routing.test.ts`.

Conventions for the migration SQL: global pages use `chapter_id = null`, ids follow the `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa00NN` sequence (check pages.json for the next free NN), and the insert ends with `on conflict (slug) where chapter_id is null do update …` so re-runs and fresh environments both converge.

## Section toolbox

Compose pages from the `ContentSection` types (`src/lib/types.ts`, rendered in `src/components/content-page.tsx`): `prose` (with optional bullets), `feature_grid`, `timeline`, `quote`, `resource_list`, `contact_cards`, `logo_grid` (grayscale org logos), `media_prose` (photo + text, optional bullets), `cta`, `people_grid` (avatar cards: name/role/eyebrow — built for leadership), `gallery_grid` (contain-fit image cards with title/subtitle — built for award winners; items without an image render as text-only cards).

Add a new section type only when no existing one fits the content's shape — then add it to the `ContentSection` union, the renderer switch, and use it from the page entry. Don't force photos into `people_grid`'s circular crop (logos and slides need `gallery_grid`'s contain-fit) and don't put people in `logo_grid` (grayscale filter).

## Assets: vendor everything

Never hotlink wial.org uploads — they will disappear when the site is retired.

- Vendor into a per-page dir: `public/leadership/`, `public/about/`, `public/awards/winners/`, etc., with meaningful kebab-case names (`2024-may-han.jpg`, `legacy-sony.png`), never the WordPress filename.
- Resize with `sips`: headshots ≤480px, content photos ≤960px, slides ≤1024px on the long edge. Convert photo-PNGs to jpg (`sips -s format jpeg -s formatOptions 85`), gif → png; keep webp (browsers are fine with it and it's small). Target tens of KB per file.
- Elementor pages often expose only a `wp-content/uploads/elementor/thumbs/...` variant; check the page HTML for the full-size original before settling for the thumb.

## Source data quality — fix it, don't republish it

wial.org data is unreliable. Judgment calls that are now precedent:

- **Filenames lie; the published association is the data.** `marie-teng.jpg` is Marie Tseng, `hy.jpg` is Lynda White, `fed-aviation-1.png` is actually the Rohde & Schwarz logo. Keep images by what they show and where they were published, not what they're named — but when the association itself is contradictory (a photo labeled as a different person than the caption), omit the image rather than risk showing the wrong person.
- **Drop meaningless images**: generic WIAL-logo placeholders and site favicons used as filler, and logos that are visibly another organization's (Air Asia's logo shown for China Southern Airlines). A text-only card beats a wrong image.
- **Text baked into images gets extracted into native sections.** Quote graphics become `quote` blocks; the Purpose-Vision-Mission one-pager became prose. Accessible, searchable, on-brand.
- **When captions are garbled but the images contain the truth** (award slides captioned "tnp", "kok"), transcribe the images (batch them through cheap vision agents) and publish the real names. Verify every image you keep by looking at it — that pass is also what catches the mismatched-logo cases.
- Fix obvious source typos in names ("MMies de Koning" → Mies de Koning), and normalize SHOUTING-CAPS names to normal casing.

## Forms

Migrate wial.org forms using the `/contact` pattern (see `src/app/(marketing)/awards/nomination/` for the fullest example): a route dir in `(marketing)` with `page.tsx`, a `'use server'` action validating and inserting via `createClient()` from `@/lib/supabase/server`, a client form component matching the contact form's styling, and a migration creating the table with RLS: insert for `anon, authenticated`, select for `authenticated` only. File-upload fields on the legacy forms become optional "link to supporting materials" URL fields unless upload is truly required. A static route like `/awards/nomination` coexists fine with the `[[...slug]]` catch-all.

Still intentionally external (candidates for this pattern later): the Better World Fund donation and application forms.

## Redirects and verification

- Old paths go in `aliasMap` (they 307 via `normalizeSegments`); multi-segment paths work (`about-us/leadership`).
- Verify before calling it done: `npm run typecheck`; `npx vitest run` on Node 22; apply the migration to local Supabase (`docker exec -i supabase_db_03-nanpossible psql -U postgres -d postgres -v ON_ERROR_STOP=1 < migration.sql` — the local stack intermittently strips table grants; if PostgREST 403s, re-grant to `anon, authenticated, service_role`); curl the new route and every redirect; eyeball the rendered page (screenshots) — layout bugs don't show up in grep.
- Record provenance in the page's `seo` block: `sourceUrl`, `sourceStatus: "migrated-from-wial"`, and `sourceNotes` explaining consolidation decisions, dropped/transformed data, and any intentionally-external links. Add a one-bullet summary of the page's conventions to `CLAUDE.md`.

## Remaining migration targets

External links still in the content, in rough priority order:

| wial.org page | Linked from | Notes |
| --- | --- | --- |
| `/become-a-partner/` | `/partners` (twice) | likely a form → contact-form pattern |
| Better World donation + application forms | `/better-world` CTAs | intentionally live for now; migrate like `/awards/nomination` |
| `/projects/...` story pages | `/better-world` story cards | long-tail; migrate as content pages or keep external deliberately |
