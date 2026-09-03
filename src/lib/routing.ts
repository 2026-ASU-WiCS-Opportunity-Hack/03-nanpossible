import type { CanonicalPageSlug, NavigationItem } from "@/lib/types";

export const navigationItems: NavigationItem[] = [
  { href: "/about", label: "About WIAL" },
  { href: "/certification", label: "Certification" },
  { href: "/clients", label: "Clients" },
  { href: "/coaches", label: "Coaches" },
  { href: "/resources", label: "Resources" },
  { href: "/partners", label: "Partners" },
  { href: "/contact", label: "Contact Us" },
];

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
  ["action-learning/benefits", "/benefits"],
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
  ["share-your-better-world-story", "/contact"],
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
  ["affiliates", "/coaches"],
  ["past-conferences", "/conferences"],
  ["2024-wial-global-conference", "/conferences"],
  ["our-clients", "/clients"],
  ["client-testimonials", "/clients"],
  ["share-your-success-story", "/clients/success-story"],
  ["privacy-policy", "/privacy"],
]);

const canonicalMap = new Map<string, CanonicalPageSlug>([
  ["", "home"],
  ["about", "about"],
  ["certification", "certification"],
  ["clients", "clients"],
  ["contact", "contact"],
  ["partners", "partners"],
  ["benefits", "benefits"],
  ["better-world", "better-world"],
  ["action-learning", "action-learning"],
  ["awards", "awards"],
  ["our-services", "our-services"],
  ["conferences", "conferences"],
  ["become-an-affiliate", "become-an-affiliate"],
  ["resources", "resources"],
  ["privacy", "privacy"],
]);

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

export function normalizeSegments(segments?: string[]) {
  const joined = (segments ?? []).join("/").toLowerCase();

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
