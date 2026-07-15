"use client";

import { useState } from "react";
import Link from "next/link";
import {
  certificationHero,
  certificationProgression,
  certificationRecertificationRules,
  certificationTracks,
} from "@/content/certification-hub";
import { getLmsLinkConfig } from "@/lib/certification";
import type { CertificationTrackKey } from "@/lib/types";

function AnchorLink({ id, label }: { id: string; label: string }) {
  return (
    <a
      href={`#${id}`}
      className="inline-block rounded-full px-4 py-1.5 text-sm font-medium text-teal-deep transition hover:bg-accent-soft"
    >
      {label}
    </a>
  );
}

function TrackSection({
  track,
  isActive,
  onToggle,
}: {
  track: (typeof certificationTracks)[0];
  isActive: boolean;
  onToggle: () => void;
}) {
  const lmsConfig = getLmsLinkConfig();
  const lmsUrl = lmsConfig.levelUrls[track.key] || lmsConfig.globalUrl;

  return (
    <div
      id={track.anchor}
      className="rounded-lg border border-gray-200 bg-white shadow-sm transition"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
      >
        <div>
          <span className="inline-block rounded-full bg-teal-deep/10 px-2.5 py-0.5 text-xs font-semibold text-teal-deep">
            {track.level}
          </span>
          <h3 className="mt-1 text-lg font-semibold">{track.title}</h3>
          <p className="text-sm text-foreground/70">{track.tagline}</p>
        </div>
        <span className="text-2xl text-foreground/40">{isActive ? "−" : "+"}</span>
      </button>

      {isActive && (
        <div className="border-t border-gray-100 px-6 py-4 space-y-4">
          <p className="text-sm leading-relaxed text-foreground/80">
            {track.summary}
          </p>

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

          {track.progressionLabel && (
            <p className="text-sm italic text-foreground/60">
              {track.progressionLabel}
            </p>
          )}

          {track.lmsSummary && (
            <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <span className="font-medium">LMS access:</span> {track.lmsSummary}{" "}
              <a
                href={lmsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                Go to LMS →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressionSection() {
  return (
    <div id="progression" className="scroll-mt-20">
      <h2 className="text-2xl font-bold">Progression Path</h2>
      <p className="mt-1 text-sm text-foreground/70">
        The certification journey builds step by step, from CALC through MALC.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {certificationProgression.map((step, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm font-semibold text-teal-deep">{step.title}</div>
            <p className="mt-1 text-sm text-foreground/70">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecertificationSection() {
  return (
    <div id="recertification" className="scroll-mt-20">
      <h2 className="text-2xl font-bold">Recertification</h2>
      <p className="mt-1 text-sm text-foreground/70">
        Keep your credential current by meeting the renewal requirements for your
        level.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {certificationRecertificationRules.map((rule, idx) => {
          const track = certificationTracks.find((t) => t.key === rule.track);
          return (
            <div
              key={idx}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-teal-deep">
                  {track?.level || rule.track.toUpperCase()}
                </span>
                <span className="text-xs text-foreground/50">
                  Valid {rule.validity}
                </span>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-foreground/70 space-y-0.5">
                {rule.annualRequirements.map((item, idx2) => (
                  <li key={idx2}>{item}</li>
                ))}
              </ul>
              {rule.expiredPolicy && (
                <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span className="font-medium">Expired:</span>{" "}
                  {rule.expiredPolicy.join(" ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LmsSection() {
  const lmsConfig = getLmsLinkConfig();

  return (
    <div id="lms" className="scroll-mt-20">
      <h2 className="text-2xl font-bold">LMS Access</h2>
      <p className="mt-1 text-sm text-foreground/70">
        WIAL's Learning Management System provides course materials, recertification
        resources, and continuing education.
      </p>
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
              Global
            </span>
            <a
              href={lmsConfig.globalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-medium text-blue-600 hover:underline"
            >
              WIAL Portal →
            </a>
          </div>
          {Object.entries(lmsConfig.levelUrls).map(([key, url]) => {
            const track = certificationTracks.find((t) => t.key === key);
            return (
              <div key={key}>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
                  {track?.level || key.toUpperCase()}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium text-blue-600 hover:underline"
                >
                  Access →
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CertificationHubSections() {
  const [activeTrack, setActiveTrack] = useState<CertificationTrackKey | null>(
    null
  );

  const handleToggle = (key: CertificationTrackKey) => {
    setActiveTrack(activeTrack === key ? null : key);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-lg bg-gradient-to-r from-teal-deep/5 to-blue-deep/5 p-6">
        <span className="text-sm font-semibold uppercase tracking-wider text-teal-deep">
          {certificationHero.eyebrow}
        </span>
        <h1 className="mt-1 text-2xl font-bold">{certificationHero.title}</h1>
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
      </div>

      {/* Anchor Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-3">
        {certificationHero.anchors.map((anchor) => (
          <AnchorLink key={anchor.id} id={anchor.id} label={anchor.label} />
        ))}
      </div>

      {/* Tracks */}
      <div className="space-y-3">
        {certificationTracks.map((track) => (
          <TrackSection
            key={track.key}
            track={track}
            isActive={activeTrack === track.key}
            onToggle={() => handleToggle(track.key)}
          />
        ))}
      </div>

      {/* Progression */}
      <ProgressionSection />

      {/* Recertification */}
      <RecertificationSection />

      {/* LMS */}
      <LmsSection />

      {/* Contact CTA */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <h3 className="text-lg font-semibold">Ready to Get Certified?</h3>
        <p className="mt-1 text-sm text-foreground/70">
          Contact us to learn more about WIAL certification programs and find a
          certification path that's right for you.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-md bg-teal-deep px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-deep/90"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}