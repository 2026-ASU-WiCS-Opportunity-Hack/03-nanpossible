# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WIAL Platform — a multi-tenant SaaS for the World Institute for Action Learning. Chapters get subdomain-based microsites (e.g., `usa.wial.org`), coaches have AI-powered search profiles, and certifications (CALC/PALC/SALC/MALC) are managed with RBAC.

## Commands

- `npm run dev` — dev server (custom wrapper in `scripts/dev-server.mjs`)
- `npm run build` — production build (custom wrapper in `scripts/reliable-build.mjs`, outputs to `.next.nosync`)
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript strict check (`tsc --noEmit`)
- `npm run test` — Vitest (all tests)
- `npx vitest run src/lib/foo.test.ts` — run a single test file
- `npm run seed:coaches` — seed sample coaches
- `npm run crawl:coaches` — crawl directory.wial.org into `data/coaches-directory.json`
- `npm run import:coaches` — import crawled coaches into the `coaches` table (add `--emit-sql out.sql` to generate psql-able SQL instead of writing via the data API; photos are re-hosted to the `coach-photos` bucket either way)
- `npm run manage:roles` — CLI for role management

Vitest requires Node 22 (`nvm use 22`) — it fails with `ERR_REQUIRE_ESM` on Node 20, which may be the shell default.

## Architecture

### Multi-Tenancy (Middleware → URL Rewrite)
`src/middleware.ts` extracts subdomain from hostname, looks up the chapter (with 60s cache), injects `x-wial-tenant`/`x-chapter-id`/etc. headers, and rewrites requests to `/sites/[tenant]/[path]` internally. Routes like `/login`, `/auth/*`, `/admin/*`, `/dashboard/*` bypass rewriting.

### Route Layout
- `src/app/(marketing)/` — public pages (coach directory, certification hub)
- `src/app/(tenant)/sites/[tenant]/` — chapter microsites (served via middleware rewrite)
- `src/app/admin/` — platform & chapter admin (global, chapter, approvals)
- `src/app/account/` — authenticated user area (profile, certifications, dues, registration flows)
- `src/app/api/` — API routes (search, chatbot, embed, audio, payments, content, chapters)

### Hybrid Coach Search (`src/lib/coach-search.ts`)
Combines three strategies: Postgres-native keyword search (weighted tsvector FTS + pg_trgm fuzzy matching via the `search_coaches_keyword` RPC, with an in-memory scan fallback when the RPC is unavailable), LLM-powered query parsing (Claude Haiku via OpenRouter), and name fallback. Results cached in-memory (5-min TTL). Search columns (`search_text`, `search_vector`) are maintained by a DB trigger on `coaches`. Legacy pgvector artifacts (`embedding` column, `search_coaches`, `set_coach_embedding`) remain in the DB but are unused by the app.

### RBAC (5-tier)
Roles: `platform_admin`, `chapter_admin`, `content_creator`, `coach`, `public_visitor`. Enforced at three layers: Supabase RLS policies, middleware (protected routes), and application logic (`src/lib/auth.ts`).

### Supabase Clients
- `createServiceRoleSupabaseClient()` — admin/server operations
- `createSupabaseContentClient()` — public/tenant-scoped reads
- `createServerSupabaseAuthClient()` — auth operations (cookies)
- `createBrowserSupabaseClient()` — client-side

### Database
PostgreSQL via Supabase with pgvector extension. Migrations in `supabase/migrations/`. Falls back to JSON fixtures in `src/content/` if DB is unavailable.

### Integrations
OpenRouter (LLM gateway), Stripe (payments), Credly (badges), Resend (email).

## Key Conventions

- Path alias: `@/*` maps to `src/*`
- Admin editors (events, page content) share `AdminWorkbench`: compact toolbar (static — sticky positioning here has repeatedly caused overlap bugs), optional left rail, edit pane with preview stacked below
- Admin/account pages render inside `account-grid` (320px sidebar + stage capped at ~830px) — avoid side-by-side multi-pane layouts in the stage
- Shared UI classes live in `src/app/globals.css` (`site-panel`, `eyebrow`, `field-*`, `button-link`, `account-flash`, `coach-checkbox`) — reuse them instead of ad-hoc styles; editor save-state chips come from `getWorkbenchStatusCopy` in `src/lib/workbench.ts`
- UI copy is user-facing: plain language, no component names or storage/dev jargon in visible text
- Site font is Ubuntu (matches wial.org), loaded via `next/font/google` in `src/app/layout.tsx` as `--font-ubuntu`; font stacks are the root vars in `globals.css` (legacy names `--font-source-sans`/`--font-fraunces`)
- Supabase auth emails (confirmation, recovery, magic link, invite, email change) use WIAL-branded HTML templates in `supabase/templates/`, wired via `[auth.email.template.*]` in `supabase/config.toml`; the hosted project only picks up changes via `supabase config push` (or pasting into Dashboard → Authentication → Email Templates)
- Node 22 (`.nvmrc`), strict TypeScript
- Tailwind CSS v4
- Tests co-located with source as `.test.ts` files in `src/lib/`
- Static content fixtures live in `src/content/` (JSON/TS)
- Post-login landing per role comes from `defaultHref` in `src/content/account-navigation.json`
- `/admin/chapter` opens the full-screen page builder (`BuilderWorkspace`, fixed overlay) only with an explicit `?page=` param; without it the workspace landing with admin nav renders
- User-facing copy says "affiliate" (not "chapter") — code identifiers, routes (`/admin/chapter`, `/api/chapters`), DB tables/columns (`chapters`, `chapter_id`), headers (`x-chapter-id`), and the `chapter_admin` role identifier still say "chapter"; only display text/labels were renamed
- The `ContentPage` hero (`src/components/content-page.tsx`) hides its "Contact WIAL"/"View our clients" buttons on the page they link to (no self-links); client logos are vendored in `public/clients/` and rendered via the `logo_grid` section — never hotlink wial.org uploads
- `/affiliates` renders from active `chapters` rows (`listAffiliateDirectory` in `src/lib/tenant.ts`, section swap in `src/lib/affiliates.ts`), not static content: card links use `chapters.website_url` when set, else the hosted `<subdomain>.<NEXT_PUBLIC_SITE_DOMAIN>` site; flags resolve from the free-text `country` via `countryCodeFor` (`src/lib/countries.ts`; all 249 ISO flag SVGs vendored in `public/flags/`); platform admins edit any affiliate at `/admin/global/chapters/[chapterId]` (shared `ChapterSettingsForm`); the `contact_cards` list stored on the affiliates content page is only a no-records fallback; `contact_cards` links starting with `http` open in a new tab
- Coach records originate from the official WIAL directory (directory.wial.org, a Brilliant Directories site): `scripts/crawl-wial-directory.ts` parses its `table-display-*` profile widgets (incl. exact lat/lng; `0,0` means "not geocoded"), and `scripts/import-directory-coaches.ts` upserts with deterministic UUIDs derived from the directory slug (re-runs update in place), maps the profile "Affiliate" name to `chapters.name` for `chapter_id`, and re-hosts photos to the `coach-photos` bucket and CV files to the `coach-files` bucket
- Coach profile URLs are slug-based (`/coaches/bea-carson`, route dir `src/app/(marketing)/coaches/[slug]`): slugs are canonical from the old directory for imported coaches, generated via `src/lib/slug.ts` for self-registered ones (stable — never regenerated on rename), unique per partial index `coaches_slug_key`; legacy UUID URLs 308-redirect to the slug; adding a coach column means touching `coachColumns`+`CoachDbRow`+`mapCoachRecord` (`src/lib/coaches.ts`), `SearchRow` + its select in `src/lib/coach-search.ts`, `CoachRecord` (`src/lib/types.ts`), AND the `search_coaches_keyword` RPC's `returns table` (needs drop+create, see `20260812000000` migration)
- `getChapterById` selects `chapterSettingsColumns` (`src/lib/tenant.ts`) — any `chapters` column an admin settings form edits must be in that list; `publicChapterColumns` is intentionally minimal (though it does include `country`/`website_url`, which tenant homepages render), and a column missing from the select renders blank in the form and gets nulled on the next save; the derived column strings append to `publicChapterColumns`, so never list a column in both (duplicate select)
- When a chapter has `website_url` set, its tenant homepage (`src/app/(tenant)/sites/[tenant]/page.tsx`) shows an "official website" banner above the hero (external link, new tab) and hides the `/about`+`/contact` CTA row and the "Affiliate events" section (those tenant paths 404 unless a published content page with body HTML exists)
- Platform admins edit any coach at `/admin/global/coaches` (search + paged roster) → `/admin/global/coaches/[coachId]` (`CoachSettingsForm`, service-role update incl. slug/approved/chapter reassignment)
- `/coaches` shows a dependency-free SVG world map (`CoachMap`): basemap path vendored in `src/lib/world-land-path.ts` (regenerate via `scripts/generate-world-basemap.ts`), equirectangular projection + same-country clustering + cross-country collision relaxation in `src/lib/world-map.ts`, dots aggregated by `listCoachMapPoints` in `src/lib/coaches.ts`; clicking a marker sets the country filter in `CoachSearch`
- `/better-world` (WIAL Better World Fund) consolidates wial.org's `better-world-fund` + `wial-gives-back` pages plus story summaries from `projects`; legacy paths `better-world-fund`, `better-world-fund-2`, `wial-gives-back`, `projects` redirect there, `share-your-better-world-story` → `/contact`; the Donate/Nominate CTAs intentionally link to the live wial.org forms and story cards link to the original wial.org story pages (not migrated)
- `/action-learning` (What is Action Learning?) is migrated from wial.org/action-learning/ (six components + two ground rules); the home "What WIAL offers" card and the coach-directory card link internally (`/action-learning`, `/coaches`); the "solutions for your business" card still links to the unmigrated wial.org/our-services/
- `/about` consolidates wial.org's leadership pages (`board-of-directors`, `executive-committee`, `directors-emeritus`, `advisory-board` — all alias-redirect to `/about`, as do `about-us` and `about-us/leadership`) as `people_grid` sections (a `ContentSection` type in `src/lib/types.ts` + renderer in `content-page.tsx`); the Executive Committee is just the board's President/VP/Treasurer flagged via card `eyebrow` (no separate grid), the Executive Director is a board card with eyebrow "Supported by", and headshots are vendored in `public/leadership/` (jpg, max 480px); the Purpose section text was OCR'd from the Purpose-Vision-Mission one-pager image on wial.org/about-us/, the Marquardt quote graphic is a native `quote` block (not the image), and session photos live in `public/about/`; the about migration is regenerated from the pages.json entry via a generator script — keep them in sync if editing either
- `/awards` consolidates wial.org/awards + `/award-nomination` + `/previous-wial-award-winners` (both alias-redirect to `/awards`): five categories as `feature_grid`, eligibility as prose bullets, past winners as per-year `gallery_grid` sections (contain-fit image cards; images vendored in `public/awards/winners/` as `<year>-<slug>`/`legacy-<org>`) plus a `logo_grid` for pre-2015 org winners; 2021–2024 winner names/awards were transcribed from the award-slide images themselves (source captions are garbled), generic WIAL-logo placeholders and mismatched logos (Air Asia shown for China Southern, Nanshan for MSI, a Kathy Chalmers photo for Ming Yen Yang) were dropped → text-only cards; the nomination form is migrated to `/awards/nomination` (`src/app/(marketing)/awards/nomination/`, contact-form pattern: server action → `award_nominations` table, anon-insert RLS; third-party vs self toggle shows/requires nominee fields + consent; legacy file upload became a supporting-materials URL field); `/award-nomination` alias-redirects there; the awards migration is also generated from pages.json via the same generator script as about
- Migrating a wial.org page (issue #81) requires four touches: page entry in `src/content/pages.json` (fixture fallback), a `supabase/migrations/` insert into `content_pages` (generate it with `python3 scripts/generate-page-migration.py <slug> <outfile>` so fixture and DB can't drift), the slug in `CanonicalPageSlug` (`src/lib/types.ts`), and the slug in `canonicalMap` (+ old wial.org path in `aliasMap`) in `src/lib/routing.ts`; keep CTAs on internal routes (`/certification`, `/coaches`, `/contact`); full playbook — goals, asset vendoring, data-quality precedents, remaining targets — in `rules/wial-migration.md`
