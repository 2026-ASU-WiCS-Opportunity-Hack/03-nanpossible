/**
 * Search-engine indexing is OFF for the whole platform until the wial.org
 * cutover: this deployment is a staging copy of content that still lives on
 * wial.org, and letting Google index both would split ranking between them.
 *
 * Three layers enforce it, all reading the same flag:
 * - `src/app/robots.ts` serves `Disallow: /`
 * - the root layout emits `<meta name="robots" content="noindex, nofollow">`
 * - `next.config.ts` adds an `X-Robots-Tag` header (covers PDFs/images too)
 *
 * Flip `NEXT_PUBLIC_ALLOW_SEARCH_INDEXING=true` on the production deploy once
 * the domain moves and the site should be discoverable.
 */
export const ALLOW_INDEXING_ENV = "NEXT_PUBLIC_ALLOW_SEARCH_INDEXING";

export function isSearchIndexingAllowed(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const value = env[ALLOW_INDEXING_ENV]?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

export const NOINDEX_HEADER_VALUE = "noindex, nofollow";
