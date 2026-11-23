import type { CanonicalPageSlug, NavigationItem } from "@/lib/types";

/**
 * The public coach directory lives on WIAL's Brilliant Directories site; this
 * platform no longer maintains the full coach roster for browsing.
 */
export const COACH_DIRECTORY_URL = "https://directory.wial.org/coaches";
/** Affiliates are listed on the same official directory. */
export const AFFILIATE_DIRECTORY_URL = "https://directory.wial.org/affiliates";

/**
 * Main navigation, ordered around visitor journeys (#156): learn what Action
 * Learning is, see what it does for organizations, get certified, find a
 * coach. Pages about WIAL itself sit in the "About WIAL" submenu.
 */
export const navigationItems: NavigationItem[] = [
  { href: "/action-learning", label: "What is Action Learning?" },
  { href: "/for-organizations", label: "For Organizations" },
  { href: "/certification", label: "Get Certified" },
  { href: COACH_DIRECTORY_URL, label: "Find a Coach" },
  { href: "/resources", label: "Resources" },
  {
    href: "/about",
    label: "About WIAL",
    children: [
      { href: "/clients", label: "Clients" },
      { href: "/partners", label: "Partners" },
      { href: "/conferences", label: "Conferences" },
      { href: "/awards", label: "Awards" },
      { href: "/better-world", label: "Better World Fund" },
    ],
  },
  { href: "/contact", label: "Contact" },
  // Kept last: affiliate sites inherit only the first seven items by default.
  { href: "/pay", label: "Payments" },
];

/** The affiliate journey gets its own button in the header and mobile menu. */
export const affiliateCta: NavigationItem = {
  href: "/become-an-affiliate",
  label: "Become an Affiliate",
};

/** Every destination as a flat `{ href, label }` list: parents first, then their submenu links. */
export function flattenNavigationItems(items: NavigationItem[] = navigationItems): NavigationItem[] {
  return items.flatMap(({ href, label, children }) => [
    { href, label },
    ...(children ?? []).map((child) => ({ href: child.href, label: child.label })),
  ]);
}

const aliasMap = new Map<string, string>([
  ["about-wial", "/about"],
  ["contact-us", "/contact"],
  ["library", "/resources"],
  ["wial-talk", "/resources"],
  ["action-learning/library", "/resources"],
  ["action-learning/library/books", "/resources"],
  ["action-learning/library/video-and-podcasts", "/resources"],
  ["action-learning/library/posters-infographics", "/resources"],
  ["action-learning/library/articles", "/resources"],
  ["wial-endorsed-products", "/resources"],
  ["category/wial-blog", "/resources"],
  ["category/blog", "/resources"],
  ["action-learning-personal-leadership-2", "/resources/action-learning-and-personal-leadership"],
  ["fresh-look-ground-rule-1-call-apply-strictly-coach", "/resources/action-learning-ground-rule-1"],
  ["culture-change-not-without-action-learning", "/resources/culture-change-not-without-action-learning"],
  ["rikkyo-university-receives-wial-global-award-academic-sector", "/resources/rikkyo-university-wial-global-award"],
  ["future-action-learning-2", "/resources/the-future-is-action-learning"],
  ["action-learning/benefits", "/for-organizations"],
  ["better-world-fund", "/better-world"],
  ["better-world-fund-2", "/better-world"],
  ["wial-gives-back", "/better-world"],
  ["projects", "/better-world"],
  [
    "projects/partnership-world-institute-action-learning-international-federation-red-cross",
    "/better-world/ifrc-partnership",
  ],
  [
    "projects/wial-gives-back-thailand-hospital-administration-association",
    "/better-world/thailand-hospital-administration",
  ],
  [
    "projects/wial-gives-back-supports-thailand-entrepreneurship-club",
    "/better-world/thailand-entrepreneurship-club",
  ],
  [
    "projects/grenada-red-cross-discovers-power-wial-action-learning",
    "/better-world/grenada-red-cross",
  ],
  ["projects/wial-gives-back-protector", "/better-world/malaysia-we-the-protector"],
  [
    "projects/wial-gives-back-supports-singapores-centre-non-profit-leadership",
    "/better-world/singapore-centre-for-non-profit-leadership",
  ],
  [
    "projects/singapore-book-council-team-benefited-learning-wials-process",
    "/better-world/singapore-book-council",
  ],
  [
    "projects/wial-provides-action-learning-coaching-singapore-association-deaf",
    "/better-world/singapore-association-for-the-deaf",
  ],
  [
    "projects/human-needs-project",
    "/better-world/kenya-human-needs-project",
  ],
  [
    "projects/action-learning-drives-rebuilding-community-library",
    "/better-world/dominica-community-library",
  ],
  [
    "projects/action-learning-helping-kyrgyzstan-ngo",
    "/better-world/kyrgyzstan-women-ngo",
  ],
  [
    "projects/action-learning-helps-small-village-burkina-faso-discover-alternative-ideas-accessing-safe-water",
    "/better-world/burkina-faso-safe-water",
  ],
  [
    "projects/action-learning-improves-cross-functional-communications-non-profit-taiwan",
    "/better-world/taiwan-zs-foundation",
  ],
  [
    "projects/full-scale-project-non-profit-cenpec-magali-lopes",
    "/better-world/brazil-cenpec",
  ],
  [
    "projects/pro-bono-program-transforms-lar-da-bencao-divina-brazilian-non-profit",
    "/better-world/brazil-lar-da-bencao-divina",
  ],
  [
    "projects/supporting-karibu-centre-nairobi",
    "/better-world/kenya-karibu-centre",
  ],
  [
    "projects/wial-action-learning-helps-improve-curricular-offerings",
    "/better-world/brazil-vida-jovem",
  ],
  [
    "projects/wial-brazil-sets-new-bar-pro-bono-coaching",
    "/better-world/brazil-pro-bono-coaching",
  ],
  [
    "projects/action-learning-lasting-impact-kenyan-pre-school",
    "/better-world/kenya-karibu-centre-lasting-impact",
  ],
  [
    "projects/action-learning-way-forward-cru-leadership",
    "/better-world/cru-leadership",
  ],
  [
    "projects/birthday-party-meaning",
    "/better-world/philippines-birthday-party",
  ],
  [
    "projects/breakthrough-solution-reach-10000-children",
    "/better-world/us-first-tee-of-denver",
  ],
  [
    "projects/cc-housing-trust-cru",
    "/better-world/cc-housing-trust-cru-certification",
  ],
  [
    "projects/childrens-house-santo-amaro",
    "/better-world/brazil-childrens-house-santo-amaro",
  ],
  [
    "projects/global-camps-africa",
    "/better-world/south-africa-global-camps-africa",
  ],
  [
    "projects/servebetter",
    "/better-world/malaysia-servebetter",
  ],
  [
    "projects/uwi-cave-hill-campus-harvard-national-model-united-nations-contingent",
    "/better-world/caribbean-uwi-model-un",
  ],
  [
    "projects/solution-space-freelancers-solopreneurs",
    "/better-world/thailand-your-solution-space",
  ],
  ["projects/wial-global-conference-scholarship-winners", "/better-world"],
  ["projects/better-world-fund-global-impact", "/better-world"],
  ["share-your-better-world-story", "/contact"],
  ["wial-better-world-fund-donation", "/better-world/donate"],
  ["about-us", "/about"],
  ["about-us/leadership", "/about"],
  ["board-of-directors", "/about"],
  ["executive-committee", "/about"],
  ["directors-emeritus", "/about"],
  ["advisory-board", "/about"],
  ["wials-team", "/about"],
  ["become-a-partner", "/partners"],
  ["award-nomination", "/awards/nomination"],
  ["previous-wial-award-winners", "/awards"],
  ["affiliates", AFFILIATE_DIRECTORY_URL],
  ["past-conferences", "/conferences"],
  ["2024-wial-global-conference", "/conferences"],
  ["our-clients", "/clients"],
  ["client-testimonials", "/clients"],
  ["share-your-success-story", "/clients/success-story"],
  ["certification/foundations", "/certification"],
  ["certification/calc-courses", "/certification"],
  ["programs", "/certification"],
  ["privacy-policy", "/privacy"],
  ["community-impact-infographic", "/community-impact"],
  ["community-impact-video", "/community-impact"],
]);

const canonicalMap = new Map<string, CanonicalPageSlug>([
  ["", "home"],
  ["about", "about"],
  ["certification", "certification"],
  ["clients", "clients"],
  ["contact", "contact"],
  ["partners", "partners"],
  ["better-world", "better-world"],
  ["action-learning", "action-learning"],
  ["awards", "awards"],
  ["for-organizations", "for-organizations"],
  ["conferences", "conferences"],
  ["become-an-affiliate", "become-an-affiliate"],
  ["resources", "resources"],
  ["privacy", "privacy"],
  ["community-impact", "community-impact"],
]);

/**
 * Retired global pages that now live on /for-organizations (#162). Redirected
 * permanently, and only on the global site: tenant subdomains keep the shared
 * alias behaviour (`normalizeChapterSlug`), since they have no such page.
 */
const permanentGlobalAliasMap = new Map<string, string>([
  ["our-services", "/for-organizations"],
  ["benefits", "/for-organizations"],
]);

/** True for absolute http(s) URLs — nav items pointing off-site open in a new tab. */
export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export const reservedSubdomains = new Set([
  "www",
  "api",
  "admin",
  "app",
  "mail",
  "staging",
  "dev",
  "test",
]);

export type NormalizedRoute = {
  slug: CanonicalPageSlug | null;
  redirectTo: string | null;
  permanent?: boolean;
};

export function normalizeSegments(segments?: string[]): NormalizedRoute | null {
  const joined = (segments ?? []).join("/").toLowerCase();

  if (permanentGlobalAliasMap.has(joined)) {
    return {
      slug: null,
      redirectTo: permanentGlobalAliasMap.get(joined) as string,
      permanent: true,
    };
  }

  if (aliasMap.has(joined)) {
    return {
      slug: null,
      redirectTo: aliasMap.get(joined) as string,
    };
  }

  if (!canonicalMap.has(joined)) {
    return null;
  }

  return {
    slug: canonicalMap.get(joined) as CanonicalPageSlug,
    redirectTo: null,
  };
}

export function normalizeChapterSlug(segment?: string | null) {
  const normalized = segment?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return {
      slug: "home",
      redirectTo: null,
    };
  }

  if (aliasMap.has(normalized)) {
    return {
      slug: null,
      redirectTo: aliasMap.get(normalized) as string,
    };
  }

  return {
    slug: normalized,
    redirectTo: null,
  };
}

export function getTenantCandidate(hostname: string, siteDomain = "wial.org") {
  const host = hostname.split(":")[0].toLowerCase();

  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  if (host.endsWith(".localhost")) {
    return host.replace(".localhost", "");
  }

  if (host.endsWith(".lvh.me")) {
    return host.replace(".lvh.me", "");
  }

  if (host === siteDomain || host === `www.${siteDomain}`) {
    return null;
  }

  if (host.endsWith(`.${siteDomain}`)) {
    return host.replace(`.${siteDomain}`, "");
  }

  return null;
}

export function getTenantCandidateForRequest(options: {
  hostname: string;
  siteDomain?: string;
  searchChapter?: string | null;
}) {
  const hostCandidate = getTenantCandidate(options.hostname, options.siteDomain);

  if (hostCandidate) {
    return hostCandidate;
  }

  const host = options.hostname.split(":")[0].toLowerCase();

  if (
    (host === "localhost" || host === "127.0.0.1") &&
    options.searchChapter?.trim()
  ) {
    return options.searchChapter.trim().toLowerCase();
  }

  return null;
}

export function isValidSubdomain(value: string) {
  return /^[a-z0-9-]{2,30}$/.test(value);
}

export function isReservedSubdomain(value: string) {
  return reservedSubdomains.has(value);
}

export function shouldBypassTenantRewrite(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/reset-password" ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/")
  );
}
