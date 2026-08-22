import {
  certificationBadging,
  certificationHero,
  certificationProgression,
  certificationRecertificationRules,
  certificationTracks,
} from "@/content/certification-hub";
import type {
  CertificationLevel,
  CertificationTrack,
  CertificationTrackKey,
  LmsLinkConfig,
} from "@/lib/types";

const DEFAULT_LMS_URL = "https://wialportal.org/";

const levelKeyMap: Record<CertificationLevel, CertificationTrackKey> = {
  CALC: "calc",
  PALC: "palc",
  SALC: "salc",
  MALC: "malc",
};

export function getCertificationHubContent() {
  return {
    hero: certificationHero,
    badging: certificationBadging,
    progression: certificationProgression,
    tracks: certificationTracks,
    recertification: certificationRecertificationRules,
  };
}

export function getLmsLinkConfig(): LmsLinkConfig {
  const globalUrl = process.env.NEXT_PUBLIC_WIAL_LMS_URL?.trim() || DEFAULT_LMS_URL;

  return {
    globalUrl,
    levelUrls: {
      calc: process.env.NEXT_PUBLIC_WIAL_LMS_CALC_URL?.trim() || globalUrl,
      palc: process.env.NEXT_PUBLIC_WIAL_LMS_PALC_URL?.trim() || globalUrl,
      salc: process.env.NEXT_PUBLIC_WIAL_LMS_SALC_URL?.trim() || globalUrl,
      malc: process.env.NEXT_PUBLIC_WIAL_LMS_MALC_URL?.trim() || globalUrl,
    },
  };
}

export function getCertificationLmsUrl(level: CertificationLevel) {
  const config = getLmsLinkConfig();
  return config.levelUrls[levelKeyMap[level]] ?? config.globalUrl;
}

export function getCertificationTrack(track: CertificationTrackKey): CertificationTrack {
  const match = certificationTracks.find((entry) => entry.key === track);

  if (!match) {
    throw new Error(`Unknown certification track: ${track}`);
  }

  return match;
}

export function getAllCertificationTracks() {
  return certificationTracks;
}

export function getRecertificationRulesForTrack(trackKey: string) {
  return certificationRecertificationRules.find(
    (rule) => rule.track === trackKey
  ) || null;
}

export function getAllRecertificationRules() {
  return certificationRecertificationRules;
}

export function getCertificationProgression() {
  return certificationProgression;
}

// ============================================================
// FIXED: Add explicit return type
// ============================================================
type TrackDocuments = {
  requirements: { href: string } | null;
  application: { href: string } | null;
  recertification: { href: string } | null;
  extras: Array<{ href: string }>;
};

export function getTrackDocuments(track: CertificationTrackKey): TrackDocuments {
  // Documents have been removed per issue requirements
  // Return null for document fields
  return {
    requirements: null,
    application: null,
    recertification: null,
    extras: [],
  };
}