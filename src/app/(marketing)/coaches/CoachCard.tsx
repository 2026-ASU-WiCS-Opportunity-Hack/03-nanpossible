import Image from "next/image";
import Link from "next/link";
import {
  formatCoachLocation,
  getCertificationBadgeTone,
  getCoachInitials,
} from "@/lib/coach-presenters";
import { countryFlagSrc } from "@/lib/countries";
import type { CoachAffiliateLink, CoachRecord } from "@/lib/types";

type CoachCardProps = {
  coach: CoachRecord;
  affiliate?: CoachAffiliateLink | null;
};

function truncateBio(text: string | null, limit = 150) {
  if (!text) {
    return "WIAL-certified coach profile available for direct contact and affiliate referral.";
  }

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function CoachCard({ coach, affiliate }: CoachCardProps) {
  const location = formatCoachLocation(coach);
  const flagSrc = countryFlagSrc(coach.locationCountry);
  const languages = coach.languages
    .map((language) => language.toUpperCase())
    .join(", ");
  const credlyBadgeImage =
    coach.credlyBadgeImageUrl ??
    (coach.credlyBadgeUrl?.match(/\.(png|jpg|jpeg|webp|svg)(?:\?.*)?$/i)
      ? coach.credlyBadgeUrl
      : null);
  const showCredlyBadgeImage = Boolean(
    credlyBadgeImage?.match(/^https:\/\/(images\.credly\.com|wial\.org|www\.wial\.org)\//i),
  );

  return (
    <article className="site-panel group overflow-hidden rounded-[2rem] p-5 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="coach-avatar-frame">
          {coach.photoUrl ? (
            <Image
              alt={coach.name}
              className="h-full w-full object-cover"
              height={96}
              loading="lazy"
              src={coach.photoUrl}
              width={96}
            />
          ) : (
            <span className="coach-avatar-fallback">
              {getCoachInitials(coach.name)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-2xl leading-none tracking-[-0.04em] text-teal-deep">
                {coach.name}
              </h3>
              {location ? (
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-foreground/55">
                  {flagSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-3.5 w-5 shrink-0 rounded-[2px] border border-line object-cover"
                      height={14}
                      loading="lazy"
                      src={flagSrc}
                      width={20}
                    />
                  ) : null}
                  <span className="min-w-0">{location}</span>
                </p>
              ) : null}
            </div>

            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${getCertificationBadgeTone(coach.certLevel)}`}
            >
              {coach.certLevel ?? "Pending"}
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-foreground/78">
            {truncateBio(coach.bio)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {coach.specializations.slice(0, 3).map((specialization) => (
              <span className="coach-pill" key={specialization}>
                {specialization}
              </span>
            ))}
          </div>

          {languages ? (
            <p className="mt-4 text-sm text-foreground/62">
              <span className="font-semibold text-teal-deep">Languages:</span>{" "}
              {languages}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex min-w-0 items-center gap-3">
          {showCredlyBadgeImage && credlyBadgeImage ? (
            <a
              className="overflow-hidden rounded-[0.9rem] border border-line bg-white/80 p-1 transition hover:border-accent"
              href={coach.credlyBadgeUrl ?? credlyBadgeImage}
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt={coach.credlyBadgeTitle ?? `${coach.name} Credly badge`}
                className="h-10 w-10 rounded-[0.55rem] object-cover"
                height={40}
                loading="lazy"
                src={credlyBadgeImage}
                width={40}
              />
            </a>
          ) : null}
          {coach.similarity != null ? (
            <span className="text-sm font-semibold text-foreground/58">
              Similarity {(coach.similarity * 100).toFixed(0)}%
            </span>
          ) : affiliate ? (
            <a
              className="min-w-0 truncate text-sm font-semibold text-teal transition hover:text-accent"
              href={affiliate.href}
              rel="noreferrer"
              target="_blank"
            >
              {affiliate.name} <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="text-sm font-semibold text-foreground/58">
              {showCredlyBadgeImage ? "Credly badge linked" : "Approved WIAL coach"}
            </span>
          )}
        </div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal transition group-hover:text-accent"
          href={`/coaches/${encodeURIComponent(coach.slug ?? coach.id)}`}
        >
          View profile
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
