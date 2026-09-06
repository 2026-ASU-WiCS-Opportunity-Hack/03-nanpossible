export type CanonicalPageSlug =
  | "home"
  | "about"
  | "certification"
  | "clients"
  | "contact"
  | "partners"
  | "benefits"
  | "better-world"
  | "action-learning"
  | "awards"
  | "our-services"
  | "conferences"
  | "become-an-affiliate"
  | "resources"
  | "privacy";

export type AppRole =
  | "platform_admin"
  | "chapter_admin"
  | "content_creator"
  | "coach"
  | "public_visitor";

export type CertificationLevel = "CALC" | "PALC" | "SALC" | "MALC";

export type CertificationTrackKey = "calc" | "palc" | "salc" | "malc";

export type CertificationDocumentKind =
  | "requirements"
  | "application"
  | "recertification"
  | "sample"
  | "faq";

export type CertificationDocument = {
  id: string;
  track: CertificationTrackKey | "global";
  kind: CertificationDocumentKind;
  label: string;
  href: string;
  sourceUrl: string | null;
  mirrored: boolean;
  fileType: "pdf" | "doc" | "external";
  updatedLabel: string;
};

export type CertificationTrack = {
  key: CertificationTrackKey;   
  level: CertificationLevel;
  anchor: string;
  title: string;
  tagline: string;
  summary: string;
  eligibility: string[];
  requirements: string[];
  progressionLabel: string;
};

export type CertificationRecertificationRule = {
  track: CertificationTrackKey;
  validity: string;
  annualRequirements: string[];
  expiredPolicy?: string[];
};

export type LmsLinkConfig = {
  globalUrl: string | null;
  levelUrls: Partial<Record<CertificationTrackKey, string>>;
};

export type NavigationItem = {
  href: string;
  label: string;
};

export type AccountNavItem = {
  href: string;
  label: string;
  roles: AppRole[];
};

export type AccountRoleConfig = {
  defaultHref: string;
  items: Array<Pick<AccountNavItem, "href" | "label">>;
};

export type AccountNavigationConfig = {
  authMode: "password_login_public_visitor_progression";
  profileFields: string[];
  roles: Record<AppRole, AccountRoleConfig>;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  chapterId: string | null;
  assignedChapters: string[];
  phone: string | null;
  phoneCountryCode?: string | null;
  location: string | null;
  bio: string | null;
  photoUrl: string | null;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  chapterId: string | null;
  chapterName: string | null;
  assignedChapters: string[];
  assignedChapterNames: string[];
};

export type RoleAssignmentInput = {
  actorUserId: string;
  userId: string;
  role: AppRole;
  chapterId: string | null;
  assignedChapters: string[];
};

export type CoachRecord = {
  id: string;
  userId: string | null;
  chapterId: string | null;
  slug: string | null;
  name: string;
  title: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
  photoUrl: string | null;
  certLevel: CertificationLevel | null;
  certValidUntil: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationCountry: string | null;
  locationLat: number | null;
  locationLng: number | null;
  bio: string | null;
  credentials: string | null;
  awards: string | null;
  cvUrl: string | null;
  specializations: string[];
  languages: string[];
  website: string | null;
  linkedin: string | null;
  blogUrl: string | null;
  youtubeUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  credlyBadgeUrl: string | null;
  credlyBadgeImageUrl?: string | null;
  credlyBadgeTitle?: string | null;
  credlyBadgeSyncedAt?: string | null;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  lastApprovedAt: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
  similarity?: number;
};

export type CoachFacetOptions = {
  countries: string[];
  languages: string[];
};

/** One dot on the /coaches world map: approved coaches aggregated by place. */
/** Affiliate link shown on coach cards, keyed by chapter id. */
export type CoachAffiliateLink = {
  name: string;
  href: string;
};

export type AffiliateMapEntry = {
  name: string;
  country: string;
  href: string;
};

export type CoachMapPoint = {
  city: string | null;
  country: string | null;
  lat: number;
  lng: number;
  count: number;
};

export type CoachSearchFilters = {
  certLevel?: CertificationLevel | null;
  country?: string | null;
  city?: string | null;
  language?: string | null;
  specializations?: string[] | null;
};

export type ParsedCoachQuery = {
  cert_level: CertificationLevel | null;
  country: string | null;
  city: string | null;
  specializations: string[] | null;
  language: string | null;
  semantic_query: string;
};

export type CoachSearchMode = "filters" | "semantic" | "hybrid" | "name_fallback";

export type CoachSearchResponse = {
  coaches: CoachRecord[];
  parsedQuery: ParsedCoachQuery | null;
  mode: CoachSearchMode;
  total: number;
  nextOffset: number | null;
};

export type ChapterRecord = {
  id: string;
  name: string;
  subdomain: string;
  region: string | null;
  language: string;
  country: string | null;
  leadUserId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactPhoneCountryCode: string | null
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  stripeAccountId: string | null;
  directorySlug?: string | null;
  contactName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  blogUrl?: string | null;
  config: Record<string, unknown>;
  status: "active" | "draft" | "inactive";
  locale?: string;
  themeJson?: Record<string, string>;
  tagline?: string;
  builderChromeState?: ChapterBuilderChromeStateV1 | null;
  builderChromeDraft?: ChapterBuilderChromeV1 | null;
  builderChromePublished?: ChapterBuilderChromeV1 | null;
};

export type MetricItem = {
  label: string;
  value: string;
};

export type FeatureItem = {
  eyebrow?: string;
  title: string;
  body: string;
  href?: string;
  label?: string;
  kind?: string;
  year?: string;
  image?: string;
  imageAlt?: string;
};

export type ContentSection =
  | {
      type: "prose";
      title: string;
      paragraphs: string[];
      bullets?: string[];
    }
  | {
      type: "feature_grid";
      title: string;
      items: FeatureItem[];
    }
  | {
      type: "timeline";
      title: string;
      items: FeatureItem[];
    }
  | {
      type: "quote";
      quote: string;
      attribution: string;
    }
  | {
      type: "resource_list";
      title: string;
      description: string;
      items: Required<Pick<FeatureItem, "title" | "body" | "href" | "label" | "kind">>[];
    }
  | {
      type: "contact_cards";
      title: string;
      items: FeatureItem[];
    }
  | {
      type: "pricing_tiers";
      title: string;
      intro?: string;
      footnote?: string;
      plans: {
        name: string;
        description?: string;
        /** Color family for the plan card: WIAL red (default) or the olive accent. */
        tone?: "primary" | "accent";
        /** Ascending headcount bands; `max` null = open-ended. */
        bands: { label: string; price: string; min: number; max: number | null }[];
      }[];
      cta?: { label: string; href: string };
    }
  | {
      /** Short organizational statements (purpose / vision / mission) side by side. */
      type: "statements";
      items: { label: string; body: string }[];
    }
  | {
      type: "logo_grid";
      title: string;
      compact?: boolean;
      /** Items without a logo render as a name tile. */
      items: { name: string; logo?: string; href?: string }[];
    }
  | {
      type: "media_prose";
      title: string;
      image: string;
      imageAlt: string;
      paragraphs: string[];
      bullets?: string[];
      caption?: string;
      imagePosition?: "left" | "right";
    }
  | {
      type: "cta";
      title: string;
      body: string;
      href: string;
      label: string;
    }
  | {
      type: "gallery_grid";
      title: string;
      description?: string;
      items: {
        title: string;
        subtitle?: string;
        image?: string;
        imageAlt?: string;
      }[];
    }
  | {
      type: "people_grid";
      title: string;
      description?: string;
      items: {
        name: string;
        role: string;
        image?: string;
        imageAlt?: string;
        eyebrow?: string;
      }[];
    }
  | {
      type: "testimonial_grid";
      title: string;
      description?: string;
      items: {
        organization: string;
        name: string;
        role?: string;
        quote?: string;
        context?: string;
        logo?: string;
        videoUrl?: string;
        videoTitle?: string;
      }[];
    };

export type LibraryKind =
  | "article"
  | "book"
  | "video"
  | "podcast"
  | "poster"
  | "infographic";

/** One entry of the migrated wial.org Library (`library_items` / `src/content/library.json`). */
export type Partner = {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string | null;
  description: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  countryCode: string | null;
  /** Site-relative path (vendored logo) or absolute URL (admin upload / paste). */
  logoUrl: string | null;
  /** Profile URL on the official directory.wial.org listing, when imported from it. */
  directoryUrl: string | null;
  sortOrder: number;
  active: boolean;
};

export type LibraryItem = {
  slug: string;
  kind: LibraryKind;
  title: string;
  summary: string | null;
  publishedOn: string;
  sourceUrl: string;
  /** Amazon / YouTube page for books and videos. */
  externalUrl: string | null;
  /** Object path inside the public `resource-files` bucket (PDF, MP3, poster image). */
  filePath: string | null;
  fileType: string | null;
  thumbnailPath: string | null;
};

/** A deduplicated WIAL Talk coaching scenario (`src/content/wial-talk-scenarios.json`). */
export type WialTalkScenario = {
  slug: string;
  title: string;
  prompt: string;
  firstPostedOn: string;
  lastPostedOn: string;
  timesPosted: number;
};

/** A purchasable item on /pay: an active one-time Stripe Price with its Product. */
export type PaymentType = {
  priceId: string;
  productId: string;
  name: string;
  nickname: string | null;
  description: string | null;
  /** Minor units (cents) as Stripe stores them. */
  amount: number;
  currency: string;
};

export type PaymentRecord = {
  id: string | null;
  stripeSessionId: string;
  productName: string;
  amount: number;
  currency: string;
  payerEmail: string | null;
  payerName: string | null;
  userId: string | null;
  status: string;
  paidAt: string | null;
  /** Checkout session metadata.source, e.g. "better-world-donation"; only set fresh from Stripe. */
  source: string | null;
};

export type StripeConfigStatus = {
  configured: boolean;
  source: "vault" | "env" | "none";
  mode: "test" | "live" | null;
  lastFour: string | null;
};

export type ContentBody = {
  heroIntro: string;
  metrics: MetricItem[];
  sections: ContentSection[];
};

export type PageEditorKind = "legacy" | "builder";

export type PageLiveRenderSource = "builder" | "legacy";

export type BuilderTextAlign = "left" | "center" | "right";

export type BuilderButtonTone = "primary" | "secondary";

export type BuilderImageFit = "cover" | "contain";

export type BuilderSectionTone = "canvas" | "warm" | "mint" | "blush" | "ink";

export type BuilderDesktopFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};

export type BuilderBlockBaseV1 = {
  id: string;
  desktop: BuilderDesktopFrame;
};

export type BuilderHeroBlockV1 = BuilderBlockBaseV1 & {
  type: "hero";
  eyebrow: string;
  title: string;
  body: string;
  buttonLabel?: string;
  buttonHref?: string;
  align: BuilderTextAlign;
};

export type BuilderTextBlockV1 = BuilderBlockBaseV1 & {
  type: "text";
  title?: string;
  body: string;
  align: BuilderTextAlign;
};

export type BuilderImageBlockV1 = BuilderBlockBaseV1 & {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  fit: BuilderImageFit;
};

export type BuilderButtonBlockV1 = BuilderBlockBaseV1 & {
  type: "button";
  label: string;
  href: string;
  tone: BuilderButtonTone;
  align: BuilderTextAlign;
};

export type BuilderQuoteBlockV1 = BuilderBlockBaseV1 & {
  type: "quote";
  quote: string;
  attribution: string;
  align: BuilderTextAlign;
};

export type BuilderSpacerBlockV1 = BuilderBlockBaseV1 & {
  type: "spacer";
  height: number;
};

export type BuilderBlockV1 =
  | BuilderHeroBlockV1
  | BuilderTextBlockV1
  | BuilderImageBlockV1
  | BuilderButtonBlockV1
  | BuilderQuoteBlockV1
  | BuilderSpacerBlockV1;

export type BuilderSectionBackgroundV1 = {
  tone: BuilderSectionTone;
  color: string;
  accent: string;
};

export type BuilderSectionV1 = {
  id: string;
  name: string;
  minHeight: number;
  paddingTop: number;
  paddingBottom: number;
  background: BuilderSectionBackgroundV1;
  blocks: BuilderBlockV1[];
};

export type BuilderPageDocV1 = {
  schemaVersion: 1;
  title: string;
  sections: BuilderSectionV1[];
};

export type BuilderPageStateV1 = {
  editorKind: "builder";
  schemaVersion: 1;
  draft: BuilderPageDocV1;
  published: BuilderPageDocV1 | null;
};

export type BuilderSurfaceKind = "header" | "page" | "footer";

export type BuilderNodeBaseV2 = BuilderBlockBaseV1;

export type BuilderHeroNodeV2 = BuilderHeroBlockV1;

export type BuilderTextNodeV2 = BuilderTextBlockV1;

export type BuilderImageNodeV2 = BuilderImageBlockV1;

export type BuilderButtonNodeV2 = BuilderButtonBlockV1;

export type BuilderQuoteNodeV2 = BuilderQuoteBlockV1;

export type BuilderSpacerNodeV2 = BuilderSpacerBlockV1;

export type BuilderNodeV2 =
  | BuilderHeroNodeV2
  | BuilderTextNodeV2
  | BuilderImageNodeV2
  | BuilderButtonNodeV2
  | BuilderQuoteNodeV2
  | BuilderSpacerNodeV2;

export type BuilderSurfaceBackgroundV2 = BuilderSectionBackgroundV1;

export type BuilderArtboardV2 = {
  width: number;
  minHeight: number;
  background: BuilderSurfaceBackgroundV2;
  nodes: BuilderNodeV2[];
};

export type BuilderSurfaceDocV2 = {
  minHeight: number;
  background: BuilderSurfaceBackgroundV2;
  nodes: BuilderNodeV2[];
};

export type BuilderPageDocV2 = {
  schemaVersion: 2;
  title: string;
  artboard: BuilderArtboardV2;
};

export type BuilderPageStateV2 = {
  editorKind: "builder";
  schemaVersion: 2;
  draft: BuilderPageDocV2;
  published: BuilderPageDocV2 | null;
};

export type ChapterBuilderChromeV1 = {
  schemaVersion: 1;
  brandLabel: string;
  brandHref: string;
  navigationItems: NavigationItem[];
  footerLegal: string;
  header: BuilderSurfaceDocV2;
  footer: BuilderSurfaceDocV2;
};

export type ChapterBuilderChromeStateV1 = {
  schemaVersion: 1;
  draft: ChapterBuilderChromeV1;
  published: ChapterBuilderChromeV1 | null;
};

export type SeoRecord = {
  description: string;
  sourceUrl: string;
  sourceStatus: string;
  sourceNotes: string;
};

export type ContentPageRecord = {
  id: string;
  chapterId: string | null;
  slug: string;
  title: string;
  isGlobal: boolean;
  language: string;
  sortOrder: number;
  published: boolean;
  aiGenerated: boolean;
  editorKind: PageEditorKind;
  publishedEditorKind: PageEditorKind;
  hasPublishedBuilderSnapshot: boolean;
  liveRenderSource: PageLiveRenderSource;
  bodyHtml?: string;
  bodyJson?: unknown;
  bodyRichtext: ContentBody;
  builderState?: BuilderPageStateV2 | null;
  builderDraft?: BuilderPageDocV2 | null;
  builderPublished?: BuilderPageDocV2 | null;
  seo: SeoRecord;
};

export type ChapterContextValue = {
  id: string;
  subdomain: string;
  name: string;
  language: string;
} | null;

export type EventRecord = {
  id: string;
  chapterId: string;
  title: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  description: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChapterProvisionInput = {
  name: string;
  subdomain: string;
  region: string;
  country: string;
  language: string;
  leadEmail: string;
  contactEmail: string;
  contactPhone: string;
  contactPhoneCountryCode: string;
  description: string;
  websiteUrl: string;
};

export type GenerationTone = "professional" | "warm" | "academic";

export type SiteContext =
  | {
      isGlobal: true;
      tenant: null;
      host: string;
    }
  | {
      isGlobal: false;
      tenant: ChapterRecord;
      host: string;
    };
