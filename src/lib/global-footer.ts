export type GlobalFooterLink = {
  id: string;
  label: string;
  href: string;
};

export type GlobalFooterContent = {
  eyebrow: string;
  heading: string;
  description: string;
  contactHeading: string;
  address: string;
  email: string;
  linksHeading: string;
  links: GlobalFooterLink[];
  leftLegal: string;
  rightLegal: string;
};

export type GlobalFooterState = {
  draft: GlobalFooterContent;
  published: GlobalFooterContent | null;
};

export const defaultGlobalFooterContent: GlobalFooterContent = {
  eyebrow: "World Institute for Action Learning",
  heading: "Solving real problems while developing leaders and teams.",
  description:
    "WIAL is the global certifying body for Action Learning, supported by a network of affiliates and certified coaches around the world.",
  contactHeading: "Reach WIAL",
  address: "P.O. Box 7601 #83791\nWashington, DC 20044",
  email: "info@wial.org",
  linksHeading: "Explore",
  links: [
    { id: "home", label: "Home", href: "/" },
    { id: "about", label: "About WIAL", href: "/about" },
    { id: "certification", label: "Certification", href: "/certification" },
    { id: "clients", label: "Clients", href: "/clients" },
    { id: "resources", label: "Resources", href: "/resources" },
    { id: "pay", label: "Make a payment", href: "/pay" },
    { id: "contact", label: "Contact", href: "/contact" },
    { id: "privacy", label: "Privacy", href: "/privacy" },
  ],
  leftLegal: "© World Institute for Action Learning. All rights reserved.",
  rightLegal:
    "Action Learning will impact the way you work, think, and do business.",
};

function text(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : fallback;
}

function href(value: unknown, fallback: string) {
  const candidate = text(value, fallback, 500);
  return /^(\/(?!\/)|https?:\/\/|mailto:)/i.test(candidate)
    ? candidate
    : fallback;
}

export function parseGlobalFooterContent(
  value: unknown,
  fallback: GlobalFooterContent = defaultGlobalFooterContent,
): GlobalFooterContent {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const rawLinks = Array.isArray(record.links) ? record.links : fallback.links;
  const links = rawLinks.slice(0, 12).map((entry, index) => {
    const link =
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? (entry as Record<string, unknown>)
        : {};
    const fallbackLink = fallback.links[index] ?? {
      id: `link-${index + 1}`,
      label: "Link",
      href: "/",
    };

    return {
      id: text(link.id, fallbackLink.id, 80) || `link-${index + 1}`,
      label: text(link.label, fallbackLink.label, 100),
      href: href(link.href, fallbackLink.href),
    };
  });

  return {
    eyebrow: text(record.eyebrow, fallback.eyebrow, 100),
    heading: text(record.heading, fallback.heading, 300),
    description: text(record.description, fallback.description, 600),
    contactHeading: text(record.contactHeading, fallback.contactHeading, 100),
    address: text(record.address, fallback.address, 400),
    email: text(record.email, fallback.email, 200),
    linksHeading: text(record.linksHeading, fallback.linksHeading, 100),
    links,
    leftLegal: text(record.leftLegal, fallback.leftLegal, 400),
    rightLegal: text(record.rightLegal, fallback.rightLegal, 400),
  };
}

export function parseGlobalFooterState(value: unknown): GlobalFooterState {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const draft = parseGlobalFooterContent(record.draft);

  return {
    draft,
    published:
      record.published == null
        ? null
        : parseGlobalFooterContent(record.published, draft),
  };
}

export function saveGlobalFooterDraft(
  state: GlobalFooterState,
  value: unknown,
): GlobalFooterState {
  return {
    draft: parseGlobalFooterContent(value, state.draft),
    published: state.published,
  };
}

export function publishGlobalFooterDraft(
  state: GlobalFooterState,
  value: unknown,
): GlobalFooterState {
  const content = parseGlobalFooterContent(value, state.draft);

  return {
    draft: content,
    published: content,
  };
}
