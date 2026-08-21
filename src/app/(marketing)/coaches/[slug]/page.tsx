import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { parsePhoneNumber } from "libphonenumber-js";
import {
  formatCoachLocation,
  getApprovedCoachById,
  getApprovedCoachBySlug,
  getCertificationBadgeTone,
  getCertificationLevelName,
  getCoachInitials,
  listApprovedCoachSlugs,
} from "@/lib/coaches";
import { affiliateSiteUrl } from "@/lib/affiliates";
import { countryFlagSrc } from "@/lib/countries";
import { listAffiliateDirectory } from "@/lib/tenant";

type CoachDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Deduped between generateMetadata and the page render. Accepts both slugs
// and legacy uuid URLs; uuid lookups report back so the page can redirect.
const loadCoach = cache(async (param: string) => {
  const decoded = decodeURIComponent(param);

  if (UUID_PATTERN.test(decoded)) {
    return { coach: await getApprovedCoachById(decoded), byLegacyId: true };
  }

  return { coach: await getApprovedCoachBySlug(decoded), byLegacyId: false };
});

export async function generateStaticParams() {
  const slugs = await listApprovedCoachSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CoachDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { coach } = await loadCoach(slug);

  if (!coach) {
    return {
      title: "Coach not found",
    };
  }

  const description =
    coach.bio?.slice(0, 155) ??
    `${coach.name} is a WIAL-certified coach listed in the global directory.`;

  return {
    title: `${coach.name} | WIAL Coach Directory`,
    description,
    alternates: {
      canonical: `/coaches/${encodeURIComponent(coach.slug ?? coach.id)}`,
    },
    openGraph: {
      title: `${coach.name} | WIAL Coach Directory`,
      description,
      ...(coach.photoUrl ? { images: [coach.photoUrl] } : {}),
    },
  };
}

function formatPhone(phone: string) {
  try {
    return parsePhoneNumber(phone)?.formatInternational() ?? phone;
  } catch {
    return phone;
  }
}

function formatValidUntil(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function toListItems(value: string | null) {
  return (
    value
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean) ?? []
  );
}

export default async function CoachDetailPage({ params }: CoachDetailPageProps) {
  const { slug } = await params;
  const { coach, byLegacyId } = await loadCoach(slug);

  if (!coach) {
    notFound();
  }

  if (byLegacyId && coach.slug) {
    permanentRedirect(`/coaches/${encodeURIComponent(coach.slug)}`);
  }

  // "Dr." is a meaningful credential; other honorifics read as noise.
  const displayName = coach.title === "Dr." ? `Dr. ${coach.name}` : coach.name;
  const certLevelName = getCertificationLevelName(coach.certLevel);
  const location = formatCoachLocation(coach);
  const fullLocation = [coach.locationCity, coach.locationState, coach.locationCountry]
    .filter(Boolean)
    .join(", ");
  const flagSrc = countryFlagSrc(coach.locationCountry);
  const affiliate = coach.chapterId
    ? (await listAffiliateDirectory()).find(
        (chapter) => chapter.id === coach.chapterId,
      )
    : undefined;
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000";
  const validUntil = coach.certValidUntil ? formatValidUntil(coach.certValidUntil) : null;
  const credentialItems = toListItems(coach.credentials);
  const awardItems = toListItems(coach.awards);
  const socialLinks = [
    { label: "Blog", href: coach.blogUrl },
    { label: "YouTube", href: coach.youtubeUrl },
    { label: "X (Twitter)", href: coach.twitterUrl },
    { label: "Facebook", href: coach.facebookUrl },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));
  const credlyBadgeImage =
    coach.credlyBadgeImageUrl ??
    (coach.credlyBadgeUrl?.match(/\.(png|jpg|jpeg|webp|svg)(?:\?.*)?$/i)
      ? coach.credlyBadgeUrl
      : null);
  const showCredlyBadgeImage = Boolean(
    credlyBadgeImage?.match(/^https:\/\/(images\.credly\.com|wial\.org|www\.wial\.org)\//i),
  );

  return (
    <div className="page-frame">
      <div className="site-shell space-y-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal transition hover:text-accent"
          href="/coaches"
        >
          <span aria-hidden="true">←</span>
          Back to directory
        </Link>

        <section className="site-panel overflow-hidden rounded-[2.4rem] p-6 md:p-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_340px]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-start gap-5">
                <div className="coach-avatar-frame h-28 w-28">
                  {coach.photoUrl ? (
                    <Image
                      alt={coach.name}
                      className="h-full w-full object-cover"
                      height={112}
                      src={coach.photoUrl}
                      width={112}
                    />
                  ) : (
                    <span className="coach-avatar-fallback text-3xl">
                      {getCoachInitials(coach.name)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <span className="eyebrow">
                    {certLevelName ?? "Approved WIAL coach"}
                  </span>
                  <h1 className="font-display text-5xl leading-none tracking-[-0.06em] text-teal-deep">
                    {displayName}
                  </h1>
                  {coach.organization ? (
                    <p className="text-lg leading-7 text-foreground/72">
                      {coach.organization}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${getCertificationBadgeTone(coach.certLevel)}`}
                    >
                      {coach.certLevel ?? "Pending"}
                    </span>
                    {location ? (
                      <span className="coach-result-chip">
                        {flagSrc ? (
                          <img
                            alt=""
                            className="h-3.5 w-5 rounded-[2px] border border-line object-cover"
                            src={flagSrc}
                          />
                        ) : null}
                        {location}
                      </span>
                    ) : null}
                    {coach.languages.length ? (
                      <span className="coach-result-chip">
                        {coach.languages.map((language) => language.toUpperCase()).join(", ")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="site-panel rounded-[1.75rem] border border-line/60 bg-white/55 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/46">
                  Full bio
                </p>
                <p className="mt-4 whitespace-pre-line text-lg leading-8 text-foreground/78">
                  {coach.bio ?? "This coach has not added a public bio yet."}
                </p>
              </div>

              {credentialItems.length ? (
                <div className="site-panel rounded-[1.75rem] border border-line/60 bg-white/55 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/46">
                    Credentials
                  </p>
                  <ul className="mt-4 space-y-2.5 text-base leading-7 text-foreground/78">
                    {credentialItems.map((item) => (
                      <li className="flex gap-3" key={item}>
                        <span aria-hidden="true" className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-teal/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {awardItems.length ? (
                <div className="site-panel rounded-[1.75rem] border border-line/60 bg-white/55 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/46">
                    Honors &amp; awards
                  </p>
                  <ul className="mt-4 space-y-2.5 text-base leading-7 text-foreground/78">
                    {awardItems.map((item) => (
                      <li className="flex gap-3" key={item}>
                        <span aria-hidden="true" className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {coach.specializations.length ? (
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/46">
                    Specializations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {coach.specializations.map((specialization) => (
                      <span className="coach-pill" key={specialization}>
                        {specialization}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-5">
              <section className="site-panel rounded-[1.85rem] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/46">
                  Contact
                </p>
                <div className="mt-4 grid gap-3 text-sm leading-7 text-foreground/78">
                  {coach.email ? (
                    <a href={`mailto:${coach.email}`}>{coach.email}</a>
                  ) : null}
                  {coach.phone ? (
                    <a href={`tel:${coach.phone}`}>{formatPhone(coach.phone)}</a>
                  ) : null}
                  {coach.website ? (
                    <a href={coach.website} rel="noreferrer" target="_blank">
                      Website
                    </a>
                  ) : null}
                  {coach.linkedin ? (
                    <a href={coach.linkedin} rel="noreferrer" target="_blank">
                      LinkedIn
                    </a>
                  ) : null}
                </div>
                {socialLinks.length ? (
                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-line/60 pt-4 text-sm leading-6">
                    {socialLinks.map((link) => (
                      <a
                        className="text-teal transition hover:text-accent"
                        href={link.href}
                        key={link.label}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
                {coach.cvUrl ? (
                  <a
                    className="button-link secondary mt-4"
                    href={coach.cvUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Download CV
                  </a>
                ) : null}
              </section>

              <section className="site-panel rounded-[1.85rem] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/46">
                  Certification
                </p>
                <div className="mt-4 space-y-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${getCertificationBadgeTone(coach.certLevel)}`}
                  >
                    {coach.certLevel ?? "Pending"}
                  </span>
                  {certLevelName ? (
                    <p className="text-sm font-semibold text-teal-deep">{certLevelName}</p>
                  ) : null}
                  {validUntil ? (
                    <p className="text-sm leading-6 text-foreground/72">
                      Certification valid through {validUntil}
                    </p>
                  ) : null}
                  {coach.credlyBadgeTitle ? (
                    <p className="text-sm font-semibold text-teal-deep">
                      {coach.credlyBadgeTitle}
                    </p>
                  ) : null}
                  {showCredlyBadgeImage && credlyBadgeImage ? (
                    <Image
                      alt={coach.credlyBadgeTitle ?? `${coach.name} Credly badge`}
                      className="rounded-[1.25rem] border border-line bg-white/80"
                      height={180}
                      src={credlyBadgeImage}
                      width={180}
                    />
                  ) : null}
                  {coach.credlyBadgeUrl ? (
                    <a
                      className="button-link secondary"
                      href={coach.credlyBadgeUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View Credly badge
                    </a>
                  ) : null}
                </div>
              </section>

              <section className="site-panel rounded-[1.85rem] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/46">
                  Location
                </p>
                <div className="mt-4 flex items-center gap-3">
                  {flagSrc ? (
                    <img
                      alt={coach.locationCountry ? `Flag of ${coach.locationCountry}` : ""}
                      className="h-6 w-8 rounded-[0.3rem] border border-line object-cover"
                      src={flagSrc}
                    />
                  ) : null}
                  <p className="text-base leading-7 text-foreground/78">
                    {fullLocation || "Location not published"}
                  </p>
                </div>
                {affiliate ? (
                  <a
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal transition hover:text-accent"
                    href={affiliateSiteUrl(affiliate, siteDomain)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {affiliate.name} <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </section>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
