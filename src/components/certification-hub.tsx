"use client";

import { Fragment, useState, type ReactNode } from "react";
import Link from "next/link";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { trackEvent } from "@/lib/analytics";
import {
  certificationBecomeACoach,
  certificationCalcCourses,
  certificationFindTraining,
  certificationFoundations,
  certificationHero,
  certificationInHouse,
  certificationPrograms,
  certificationJourney,
  certificationTracks,
  certificationWhatYouGet,
  certificationWhy,
  type CertificationJourneyStep,
} from "@/content/certification-hub";
import { COACH_DIRECTORY_URL } from "@/lib/routing";
import type { CertificationTrack, CertificationTrackKey } from "@/lib/types";

const linkClass =
  "font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4";

function TrackDetail({ track }: { track: CertificationTrack }) {
  return (
    <div className="site-panel rounded-lg px-6 py-5">
      <span className="inline-block rounded-full bg-teal-deep/10 px-2.5 py-0.5 text-xs font-semibold text-teal-deep">
        {track.level}
      </span>
      <h3 className="mt-1 text-lg font-semibold">{track.title}</h3>
      <p className="text-sm text-foreground/70">{track.tagline}</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        {track.summary}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold">Eligibility</h4>
          <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
            {track.eligibility.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Requirements</h4>
          <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
            {track.requirements.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      {track.progressionLabel && (
        <p className="mt-4 text-sm italic text-foreground/60">
          {track.progressionLabel}
        </p>
      )}
    </div>
  );
}

function WhySection() {
  return (
    <div id={certificationWhy.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationWhy.title}</h2>
      <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
        {certificationWhy.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {/* Plain subheadings, not cards: nothing here is clickable. */}
      <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {certificationWhy.levels.map((level) => (
          <div className="border-l-2 border-teal-deep/30 pl-4" key={level.level}>
            <dt>
              <h3 className="text-base font-semibold text-teal-deep">
                {level.level}
                <span className="ml-2 text-sm font-normal text-foreground/60">
                  {level.title}
                </span>
              </h3>
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-foreground/75">
              {level.body}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FoundationsSection() {
  return (
    <div id={certificationFoundations.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationFoundations.title}</h2>
      <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
        {certificationFoundations.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          Read more about the model on{" "}
          <Link href={certificationFoundations.actionLearningHref} className={linkClass}>
            {certificationFoundations.actionLearningLabel}
          </Link>
          .
        </p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="site-panel rounded-lg px-6 py-5">
          <h3 className="text-sm font-semibold">
            {certificationFoundations.forTitle}
          </h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
            {certificationFoundations.forWho.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="site-panel rounded-lg px-6 py-5">
          <h3 className="text-sm font-semibold">
            {certificationFoundations.participantsTitle}
          </h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
            {certificationFoundations.participantsWill.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BecomeACoachSection() {
  return (
    <div id={certificationBecomeACoach.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationBecomeACoach.title}</h2>
      <div className="mt-2 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
        <div>
          <div className="max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
            {certificationBecomeACoach.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-4 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
            <p>{certificationBecomeACoach.joinNote}</p>
            <p>
              {certificationBecomeACoach.servicesBefore}
              <Link href={certificationBecomeACoach.servicesHref} className={linkClass}>
                {certificationBecomeACoach.servicesLabel}
              </Link>
              {certificationBecomeACoach.servicesAfter}
            </p>
          </div>
          <TrackedLink
            className="button-link secondary mt-4"
            event={{
              name: "cta_click",
              params: {
                cta_label: certificationBecomeACoach.contactLabel,
                cta_location: "certification",
                cta_destination: certificationBecomeACoach.contactHref,
              },
            }}
            href={certificationBecomeACoach.contactHref}
          >
            {certificationBecomeACoach.contactLabel}
          </TrackedLink>
        </div>
        <figure className="overflow-hidden rounded-lg border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={certificationBecomeACoach.image.src}
            alt={certificationBecomeACoach.image.alt}
            className="aspect-[5/4] w-full object-cover"
            loading="lazy"
          />
        </figure>
      </div>
    </div>
  );
}

function ProgramsSection() {
  return (
    <div id={certificationPrograms.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationPrograms.title}</h2>
      <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
        {certificationPrograms.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {certificationPrograms.items.map((item) => (
          <article className="feature-card rounded-lg" key={item.title}>
            <h3 className="text-sm font-semibold">
              {item.href.startsWith("#") ? (
                <a href={item.href} className={linkClass}>
                  {item.title}
                </a>
              ) : (
                <Link href={item.href} className={linkClass}>
                  {item.title}
                </Link>
              )}
            </h3>
            <p className="mt-1 text-sm text-foreground/70">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function InHouseSection() {
  // Teaser only — the full in-house programs copy lives on its own page (#143).
  return (
    <div id={certificationInHouse.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationInHouse.title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/70">
        {certificationInHouse.teaser}
      </p>
      <TrackedLink
        className="button-link secondary mt-4"
        event={{
          name: "cta_click",
          params: {
            cta_label: certificationInHouse.hrefLabel,
            cta_location: "certification",
            cta_destination: certificationInHouse.href,
          },
        }}
        href={certificationInHouse.href}
      >
        {certificationInHouse.hrefLabel}
      </TrackedLink>
    </div>
  );
}

function CalcCoursesSection() {
  return (
    <div id={certificationCalcCourses.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationCalcCourses.heading}</h2>
      <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
        {certificationCalcCourses.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="site-panel rounded-lg px-6 py-5">
          <h3 className="text-sm font-semibold">
            {certificationCalcCourses.forTitle}
          </h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
            {certificationCalcCourses.forWho.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="site-panel rounded-lg px-6 py-5">
          <h3 className="text-sm font-semibold">
            {certificationCalcCourses.learnTitle}
          </h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
            {certificationCalcCourses.learn.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-stretch">
        <div className="site-panel rounded-lg px-6 py-5">
          <h3 className="text-sm font-semibold">
            {certificationCalcCourses.certifiedTitle}
          </h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
            {certificationCalcCourses.certifiedWill.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <figure className="overflow-hidden rounded-lg border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={certificationCalcCourses.image.src}
            alt={certificationCalcCourses.image.alt}
            className="h-full min-h-56 w-full object-cover"
            loading="lazy"
          />
        </figure>
      </div>
    </div>
  );
}

function StepFacts({ step }: { step: CertificationJourneyStep }) {
  const facts = [
    { label: "Prerequisites", value: step.prerequisites },
    { label: "Time commitment", value: step.time },
    { label: "Validity and renewal", value: step.validity },
  ];

  // Spans, not a <dl>: these sit inside a <button>/<a>, which only allow phrasing content.
  return (
    <span className="mt-3 block space-y-2">
      {facts.map((fact) => (
        <span className="block" key={fact.label}>
          <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-foreground/55">
            {fact.label}
          </span>
          <span className="block text-sm leading-snug text-foreground/75">{fact.value}</span>
        </span>
      ))}
    </span>
  );
}

function StepHeading({ step, index }: { step: CertificationJourneyStep; index: number }) {
  return (
    <>
      <span className="flex items-center gap-2 pr-6">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-deep text-sm font-bold text-white"
        >
          {index + 1}
        </span>
        <span className="sr-only">Step {index + 1}: </span>
        <span className="text-base font-semibold text-teal-deep">{step.name}</span>
      </span>
      <span className="mt-1 block text-sm text-foreground/70">{step.title}</span>
    </>
  );
}

function PathwaySection() {
  const [activeTrack, setActiveTrack] = useState<CertificationTrackKey | null>(
    null
  );

  const handleToggle = (key: CertificationTrackKey) => {
    const opening = activeTrack !== key;
    if (opening) {
      trackEvent({
        name: "select_content",
        params: { content_type: "certification_level", content_id: key },
      });
    }
    setActiveTrack(opening ? key : null);
  };

  const active = certificationTracks.find((track) => track.key === activeTrack);
  const cardClass = "feature-card relative flex h-full w-full scroll-mt-20 flex-col items-stretch justify-start rounded-lg text-left";

  return (
    <div id="progression" className="scroll-mt-20">
      <h2 className="text-2xl font-bold">Your path to certification</h2>
      <p className="mt-1 max-w-3xl text-sm text-foreground/70">
        Four steps, each building on the one before. Select a certification
        level to see its full eligibility and requirements.
      </p>
      <ol className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {certificationJourney.map((step, index) => {
          const track = certificationTracks.find((item) => item.key === step.trackKey);
          const isActive = Boolean(track) && activeTrack === track?.key;

          return (
            <Fragment key={step.name}>
              <li>
                {track ? (
                  <button
                    aria-expanded={isActive}
                    className={`${cardClass} ${isActive ? "border-teal-deep/50" : ""}`}
                    id={track.anchor}
                    onClick={() => handleToggle(track.key)}
                    style={{ padding: "1.15rem" }}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute right-4 top-4 text-xl leading-none text-teal-deep"
                    >
                      {isActive ? "−" : "+"}
                    </span>
                    <StepHeading index={index} step={step} />
                    <StepFacts step={step} />
                  </button>
                ) : (
                  <a className={cardClass} href={step.href} style={{ padding: "1.15rem" }}>
                    <StepHeading index={index} step={step} />
                    <StepFacts step={step} />
                  </a>
                )}
              </li>
              {track && isActive ? (
                <li className="md:col-span-2 lg:hidden">
                  <TrackDetail track={track} />
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
      {active && (
        <div className="mt-4 hidden lg:block">
          <TrackDetail track={active} />
        </div>
      )}
    </div>
  );
}

function WhatYouGetSection() {
  // Plain subheadings, not cards: nothing here is a link target on its own.
  return (
    <div id={certificationWhatYouGet.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationWhatYouGet.title}</h2>
      <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {certificationWhatYouGet.items.map((item) => (
          <div className="border-l-2 border-teal-deep/30 pl-4" key={item.title}>
            <dt className="text-base font-semibold text-teal-deep">{item.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-foreground/75">
              {item.body}
              {"linkLabel" in item ? (
                <>
                  {" "}
                  <a
                    className={linkClass}
                    href={COACH_DIRECTORY_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.linkLabel}
                    <span aria-hidden="true"> ↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function HubCta({ href, label, variant }: { href: string; label: string; variant: string }) {
  if (href.startsWith("#")) {
    return (
      <a className={`button-link ${variant}`} href={href}>
        {label}
      </a>
    );
  }

  return (
    <TrackedLink
      className={`button-link ${variant}`}
      event={{
        name: "cta_click",
        params: { cta_label: label, cta_location: "certification", cta_destination: href },
      }}
      href={href}
    >
      {label}
    </TrackedLink>
  );
}

type CertificationHubSectionsProps = {
  /** Server-rendered "Find training in your country" block, slotted after "What you get". */
  findTraining?: ReactNode;
  beforeContact?: ReactNode;
};

export function CertificationHubSections({
  findTraining,
  beforeContact,
}: CertificationHubSectionsProps = {}) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-lg bg-gradient-to-r from-teal-deep/5 to-gold/5 p-6">
        <span className="eyebrow">{certificationHero.eyebrow}</span>
        <h1 className="mt-3 text-2xl font-bold">{certificationHero.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          {certificationHero.intro}
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          {certificationHero.metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span className="text-sm font-semibold">{metric.value}</span>
              <span className="text-sm text-foreground/50">{metric.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <HubCta {...certificationHero.primaryCta} variant="primary" />
          <HubCta {...certificationHero.secondaryCta} variant="secondary" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={certificationHero.image.src}
          alt={certificationHero.image.alt}
          className="mt-5 w-full rounded-lg object-cover"
        />
      </div>

      {/* Numbered journey: Foundations → CALC → PALC → MALC */}
      <PathwaySection />

      <WhatYouGetSection />

      {findTraining}

      <WhySection />

      <BecomeACoachSection />

      <ProgramsSection />

      <FoundationsSection />

      <CalcCoursesSection />

      <InHouseSection />

      {beforeContact}

      {/* Closing CTA */}
      <div className="site-panel mt-8 rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold">Ready to get certified?</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Tell us where you are and WIAL will connect you with the affiliate
          that runs courses in your country.
        </p>
        <div className="mt-4">
          <HubCta {...certificationHero.primaryCta} variant="primary" />
        </div>
        <p className="mt-4 text-sm text-foreground/70">
          {certificationFindTraining.affiliatePrompt}{" "}
          <Link className={linkClass} href={certificationFindTraining.affiliateHref}>
            {certificationFindTraining.affiliateLabel}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export function AccountCertificationHub() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Certifications</h2>
      <p className="text-foreground/70">
        View and manage your WIAL certifications here.
      </p>
      <div className="site-panel rounded-lg p-6">
        <p className="text-sm text-foreground/60">
          Your certifications will appear here once you complete a certification program.
        </p>
        <div className="mt-4">
          <Link href="/certification" className="button-link primary">
            Explore Certification Programs
          </Link>
        </div>
      </div>
    </div>
  );
}
