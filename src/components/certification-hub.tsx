"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  certificationBadging,
  certificationBecomeACoach,
  certificationCalcCourses,
  certificationFoundations,
  certificationHero,
  certificationInHouse,
  certificationPrograms,
  certificationProgression,
  certificationTracks,
  certificationWhy,
} from "@/content/certification-hub";
import type { CertificationTrack, CertificationTrackKey } from "@/lib/types";

function pathwaySummary(track: CertificationTrack) {
  return (
    certificationProgression.find((step) => step.title === track.level)?.body ??
    track.tagline
  );
}

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
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {certificationWhy.levels.map((level) => (
          <article className="feature-card rounded-lg" key={level.level}>
            <div className="text-sm font-semibold text-teal-deep">{level.level}</div>
            <h3 className="mt-1 text-sm font-semibold">{level.title}</h3>
            <p className="mt-1 text-sm text-foreground/70">{level.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function FoundationsSection() {
  const linkClass =
    "font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4";

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
      <div className="site-panel mt-4 rounded-lg px-6 py-5">
        <h3 className="text-sm font-semibold">
          {certificationFoundations.inHouse.title}
        </h3>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/70">
          {certificationFoundations.inHouse.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <a
          href={certificationFoundations.inHouse.moreHref}
          className="button-link secondary mt-4"
        >
          {certificationFoundations.inHouse.moreLabel}
        </a>
      </div>
    </div>
  );
}

function BecomeACoachSection() {
  const linkClass =
    "font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4";

  return (
    <div id={certificationBecomeACoach.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationBecomeACoach.title}</h2>
      <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
        {certificationBecomeACoach.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>{certificationBecomeACoach.industriesLead}</p>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {certificationBecomeACoach.industries.map((industry) => (
          <li
            className="feature-card rounded-lg text-sm text-foreground/80"
            key={industry}
          >
            {industry}
          </li>
        ))}
        <li className="feature-card rounded-lg text-sm text-foreground/60">
          {certificationBecomeACoach.industriesMore}
        </li>
      </ul>
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
      <Link
        href={certificationBecomeACoach.contactHref}
        className="button-link secondary mt-4"
      >
        {certificationBecomeACoach.contactLabel}
      </Link>
    </div>
  );
}

function ProgramsSection() {
  const linkClass =
    "font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4";

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
              <a href={item.href} className={linkClass}>
                {item.title}
              </a>
            </h3>
            <p className="mt-1 text-sm text-foreground/70">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function InHouseSection() {
  return (
    <div id={certificationInHouse.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationInHouse.title}</h2>
      <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
        {certificationInHouse.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <blockquote className="quote-block mt-4 rounded-lg">
        <p>&quot;{certificationInHouse.quote.quote}&quot;</p>
        <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-[0.16em] text-teal">
          {certificationInHouse.quote.attribution}
        </span>
      </blockquote>
      <Link
        href={certificationInHouse.contactHref}
        className="button-link secondary mt-4"
      >
        {certificationInHouse.contactLabel}
      </Link>
    </div>
  );
}

function CalcCoursesSection() {
  const linkClass =
    "font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4";

  return (
    <div id={certificationCalcCourses.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationCalcCourses.heading}</h2>
      <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
        {certificationCalcCourses.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          <span className="font-semibold text-foreground/80">
            {certificationCalcCourses.prerequisite.label}:{" "}
          </span>
          <a href={certificationCalcCourses.prerequisite.href} className={linkClass}>
            {certificationCalcCourses.prerequisite.body}
          </a>
        </p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {certificationCalcCourses.modules.map((module) => (
          <article className="site-panel rounded-lg px-6 py-5" key={module.title}>
            <h3 className="text-lg font-semibold">{module.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {module.summary}
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
              {module.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
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
      <div className="site-panel mt-4 rounded-lg px-6 py-5">
        <h3 className="text-sm font-semibold">
          {certificationCalcCourses.certifiedTitle}
        </h3>
        <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
          {certificationCalcCourses.certifiedWill.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-semibold">
          {certificationCalcCourses.skillsTitle}
        </h3>
        <p className="mt-1 text-sm text-foreground/60">
          {certificationCalcCourses.skillsSource}
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {certificationCalcCourses.skills.map((skill) => (
            <li
              className="feature-card rounded-lg text-sm text-foreground/80"
              key={skill}
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PathwaySection() {
  const [activeTrack, setActiveTrack] = useState<CertificationTrackKey | null>(
    null
  );

  const handleToggle = (key: CertificationTrackKey) => {
    setActiveTrack(activeTrack === key ? null : key);
  };

  const active = certificationTracks.find((track) => track.key === activeTrack);

  return (
    <div id="progression" className="scroll-mt-20">
      <h2 className="text-2xl font-bold">Certification pathway</h2>
      <p className="mt-1 text-sm text-foreground/70">
        Four levels build step by step, from CALC through MALC. Select a level
        to see its eligibility and requirements.
      </p>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {certificationTracks.map((track, idx) => {
          const isActive = activeTrack === track.key;
          return (
            <Fragment key={track.key}>
              <button
                id={track.anchor}
                onClick={() => handleToggle(track.key)}
                aria-expanded={isActive}
                className={`feature-card relative flex-1 scroll-mt-20 rounded-lg text-left ${
                  isActive ? "border-teal-deep/50" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-4 text-xl leading-none text-teal-deep"
                >
                  {isActive ? "−" : "+"}
                </span>
                <div className="pr-6 text-sm font-semibold text-teal-deep">
                  {track.level}
                </div>
                <p className="mt-1 text-sm text-foreground/70">
                  {pathwaySummary(track)}
                </p>
              </button>
              {isActive && (
                <div className="lg:hidden">
                  <TrackDetail track={track} />
                </div>
              )}
              {idx < certificationTracks.length - 1 && (
                <span
                  aria-hidden="true"
                  className="rotate-90 self-center text-2xl text-teal-deep/40 lg:rotate-0"
                >
                  →
                </span>
              )}
            </Fragment>
          );
        })}
      </div>
      {active && (
        <div className="mt-4 hidden lg:block">
          <TrackDetail track={active} />
        </div>
      )}
    </div>
  );
}

function BadgesSection() {
  const linkClass =
    "font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4";

  return (
    <div id="badges" className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{certificationBadging.title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-foreground/70">
        {certificationBadging.intro.beforeCredly}
        <a
          href={certificationBadging.credlyUrl}
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          {certificationBadging.intro.credlyLabel}
        </a>
        {certificationBadging.intro.afterCredly}
      </p>
      <div className="site-panel mt-4 rounded-lg px-6 py-5">
        <div className="rounded-lg bg-white px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={certificationBadging.image.src}
            alt={certificationBadging.image.alt}
            className="mx-auto w-full max-w-2xl"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">
              {certificationBadging.showsTitle}
            </h3>
            <ul className="mt-1 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
              {certificationBadging.shows.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 text-sm text-foreground/70">
            <p>{certificationBadging.claimNote}</p>
            <p>{certificationBadging.verificationNote}</p>
            <p>
              {certificationBadging.directoryNote}{" "}
              <Link href="/coaches" className={linkClass}>
                {certificationBadging.directoryLinkLabel}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificationHubSections() {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={certificationHero.image.src}
          alt={certificationHero.image.alt}
          className="mt-5 w-full rounded-lg object-cover"
        />
      </div>

      <WhySection />

      <BecomeACoachSection />

      {/* Pathway: progression cards with expandable level detail */}
      <PathwaySection />

      <ProgramsSection />

      <FoundationsSection />

      <CalcCoursesSection />

      <InHouseSection />

      {/* Digital badges */}
      <BadgesSection />

      {/* Contact CTA */}
      <div className="site-panel mt-8 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold">Ready to Get Certified?</h3>
        <p className="mt-1 text-sm text-foreground/70">
          Contact us to start certification, ask about becoming a coach, or
          bring a program in-house.
        </p>
        <Link href="/contact" className="button-link primary mt-4">
          Contact Us
        </Link>
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
