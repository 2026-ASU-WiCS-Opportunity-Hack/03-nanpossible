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
Combines four strategies: Cohere vector embeddings (pgvector), PostgreSQL full-text keyword search, LLM-powered query parsing (Claude Haiku via OpenRouter), and name fallback. Results cached in-memory (5-min TTL).

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
OpenRouter (LLM gateway), Cohere (embeddings), Stripe (payments), Credly (badges), Resend (email).

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
- Migrating a wial.org page (issue #81) requires four touches: page entry in `src/content/pages.json` (fixture fallback), a `supabase/migrations/` insert into `content_pages`, the slug in `CanonicalPageSlug` (`src/lib/types.ts`), and the slug in `canonicalMap` (+ old wial.org path in `aliasMap`) in `src/lib/routing.ts`; keep CTAs on internal routes (`/certification`, `/coaches`, `/contact`)
