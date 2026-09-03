import pages from "@/content/pages.json";
import {
  getCertificationHubContent,
  getCertificationLmsUrl,
  getTrackDocuments,
} from "@/lib/certification";
import type {
  CertificationLevel,
  CertificationTrackKey,
  ContentPageRecord,
} from "@/lib/types";

export type SiteChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const contentPages = pages as ContentPageRecord[];

function getGlobalPage(slug: string) {
  return contentPages.find((page) => page.chapterId === null && page.slug === slug) ?? null;
}

function inferTrackKey(query: string): CertificationTrackKey | null {
  const normalized = query.toLowerCase();

  if (normalized.includes("calc")) return "calc";
  if (normalized.includes("palc")) return "palc";
  if (normalized.includes("salc")) return "salc";
  if (normalized.includes("malc")) return "malc";

  return null;
}

function levelFromTrack(track: CertificationTrackKey): CertificationLevel {
  switch (track) {
    case "calc":
      return "CALC";
    case "palc":
      return "PALC";
    case "salc":
      return "SALC";
    case "malc":
      return "MALC";
  }
}

export function buildSiteAssistantContext() {
  const certification = getCertificationHubContent();
  const about = getGlobalPage("about");
  const resources = getGlobalPage("resources");
  const contact = getGlobalPage("contact");

  const trackSummaries = certification.tracks
    .map((track) => {
      const docs = getTrackDocuments(track.key);
      const renewal = certification.recertification.find(
        (rule) => rule.track === track.key,
      );
      const lmsUrl = getCertificationLmsUrl(track.level) ?? "Not configured";

      return [
        `${track.level} (${track.title})`,
        `Summary: ${track.summary}`,
        `Eligibility: ${track.eligibility.join(" | ")}`,
        `Requirements: ${track.requirements.join(" | ")}`,
        `Renewal validity: ${renewal?.validity ?? "See packet"}`,
        `Renewal obligations: ${renewal?.annualRequirements.join(" | ") ?? "See packet"}`,
        `Application form: ${docs.application?.href ?? "Not available"}`,
        `Requirements packet: ${docs.requirements?.href ?? "Not available"}`,
        `Renewal packet: ${docs.recertification?.href ?? "Not available"}`,
        `LMS link: ${lmsUrl}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "WIAL assistant context",
    "The assistant answers questions about WIAL certification, recertification, forms, badges, resources, contact, and LMS entry points.",
    `About WIAL: ${about?.bodyRichtext.heroIntro ?? ""}`,
    `Resources page summary: ${resources?.bodyRichtext.heroIntro ?? ""}`,
    `Contact page summary: ${contact?.bodyRichtext.heroIntro ?? ""}`,
    "Direct contact: info@wial.org | P.O. Box 7601 #83791, Washington, DC 20044",
    "Certification hub anchors: /certification#calc, #palc, #salc, #malc, #progression, #why, #become-a-coach, #programs, #foundations, #calc-courses, #in-house, #badges",
    [
      `Who gets certified: ${certification.becomeACoach.intro.join(" ")}`,
      `Industries: ${certification.becomeACoach.industries.join(" | ")}`,
      certification.becomeACoach.joinNote,
      `Solution Spheres: ${certification.becomeACoach.servicesHref}`,
      "Become a coach: /certification#become-a-coach or /contact",
    ].join("\n"),
    [
      `Programs: ${certification.programs.intro.join(" ")}`,
      certification.programs.items
        .map((item) => `${item.title}: ${item.body}`)
        .join(" | "),
      "Programs details: /certification#programs",
    ].join("\n"),
    [
      `Foundations of Action Learning: ${certification.foundations.intro.join(" ")}`,
      `Foundations is for: ${certification.foundations.forWho.join(" | ")}`,
      `In-house Foundations: ${certification.foundations.inHouse.paragraphs.join(" ")}`,
      "Foundations details: /certification#foundations",
    ].join("\n"),
    [
      `CALC courses: ${certification.calcCourses.intro.join(" ")}`,
      `Prerequisite: ${certification.calcCourses.prerequisite.body}`,
      `CALC 1: ${certification.calcCourses.modules[0].summary} ${certification.calcCourses.modules[0].bullets.join(" | ")}`,
      `CALC 2: ${certification.calcCourses.modules[1].summary} ${certification.calcCourses.modules[1].bullets.join(" | ")}`,
      "CALC courses details: /certification#calc-courses",
    ].join("\n"),
    [
      `In-house programs: ${certification.inHouse.intro.join(" ")}`,
      `In-house quote: "${certification.inHouse.quote.quote}" — ${certification.inHouse.quote.attribution}`,
      "In-house details: /certification#in-house or /contact",
    ].join("\n"),
    [
      `Digital badges: ${certification.badging.intro.beforeCredly}${certification.badging.intro.credlyLabel} (${certification.badging.credlyUrl})${certification.badging.intro.afterCredly}`,
      `A badge shows: ${certification.badging.shows.join(" | ")}`,
      certification.badging.claimNote,
      "Badge details: /certification#badges",
    ].join("\n"),
    trackSummaries,
  ].join("\n\n");
}

export function buildFallbackAssistantReply(query: string) {
  const normalized = query.trim().toLowerCase();
  const certification = getCertificationHubContent();
  const trackKey = inferTrackKey(normalized);

  if (!normalized) {
    return "Ask me about CALC, PALC, SALC, MALC, renewal requirements, application forms, LMS access, or Credly badges.";
  }

  if (normalized.includes("contact") || normalized.includes("email")) {
    return [
      "For certification help, contact WIAL at `info@wial.org`.",
      "You can also use `/contact` for the shared WIAL contact route.",
    ].join("\n\n");
  }

  if (normalized.includes("foundation")) {
    const foundations = certification.foundations;
    return [
      foundations.intro.join(" "),
      `${foundations.forTitle}: ${foundations.forWho.join(", ")}.`,
      `${foundations.inHouse.title}: ${foundations.inHouse.paragraphs[0]}`,
      "Learn more at `/certification#foundations`. The six components and two ground rules are on `/action-learning`.",
    ].join("\n\n");
  }

  if (
    normalized.includes("in-house") ||
    normalized.includes("in house") ||
    normalized.includes("inhouse")
  ) {
    const inHouse = certification.inHouse;
    return [
      inHouse.intro[0],
      inHouse.intro[2],
      `Learn more at \`/certification#in-house\`, or contact WIAL at \`/contact\`.`,
    ].join("\n\n");
  }

  if (
    normalized.includes("become a coach") ||
    normalized.includes("who gets") ||
    normalized.includes("who gets certified")
  ) {
    const becomeACoach = certification.becomeACoach;
    return [
      becomeACoach.intro.join(" "),
      `${becomeACoach.industriesLead} ${becomeACoach.industries.join(", ")}, ${becomeACoach.industriesMore}.`,
      becomeACoach.joinNote,
      `Solution Spheres are on \`/our-services\`. To get started, see \`/certification#become-a-coach\` or \`/contact\`.`,
    ].join("\n\n");
  }

  if (
    normalized.includes("calc course") ||
    normalized.includes("calc 1") ||
    normalized.includes("calc 2") ||
    normalized.includes("calc workshop")
  ) {
    const courses = certification.calcCourses;
    return [
      courses.intro[0],
      `${courses.prerequisite.label}: ${courses.prerequisite.body}.`,
      `${courses.modules[0].title}: ${courses.modules[0].summary}`,
      `${courses.modules[1].title}: ${courses.modules[1].summary}`,
      "Learn more at `/certification#calc-courses`.",
    ].join("\n\n");
  }

  if (normalized.includes("lms") || normalized.includes("course") || normalized.includes("portal")) {
    if (trackKey) {
      const level = levelFromTrack(trackKey);
      const lmsUrl = getCertificationLmsUrl(level);
      return [
        `${level} uses WIAL's existing external LMS rather than a duplicated in-site course system.`,
        lmsUrl ? `Open LMS: ${lmsUrl}` : "The level-specific LMS link is not configured yet.",
        "You can also review the public certification hub at `/certification`.",
      ].join("\n\n");
    }

    return [
      "WIAL keeps the current LMS external. The website links to it but does not replace it.",
      `Open LMS: ${getCertificationLmsUrl("CALC") ?? "https://wialportal.org/"}`,
      "For level-specific guidance, see `/certification`.",
    ].join("\n\n");
  }

  if (trackKey) {
    const track = certification.tracks.find((entry) => entry.key === trackKey);
    const docs = getTrackDocuments(trackKey);
    const renewal = certification.recertification.find((entry) => entry.track === trackKey);

    if (!track || !renewal) {
      return "I couldn't load that certification track right now. Try the public hub at `/certification` or contact `info@wial.org`.";
    }

    if (
      normalized.includes("renew") ||
      normalized.includes("recert") ||
      normalized.includes("expire")
    ) {
      const renewalPacket = docs.recertification?.href;
      return [
        `${track.level} is valid for ${renewal.validity}.`,
        `Current renewal requirements: ${renewal.annualRequirements.join(" ")}`,
        renewalPacket
          ? `Renewal packet: ${renewalPacket}`
          : "Renewal details are in the current certification packet.",
        renewal.expiredPolicy?.length
          ? `Expired credential policy: ${renewal.expiredPolicy.join(" ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    if (
      normalized.includes("apply") ||
      normalized.includes("application") ||
      normalized.includes("form") ||
      normalized.includes("requirements")
    ) {
      const applicationForm = docs.application?.href;
      const requirementsPacket = docs.requirements?.href;
      return [
        `${track.level} overview: ${track.summary}`,
        `Eligibility: ${track.eligibility.join(" ")}`,
        `Application expectations: ${track.requirements.join(" ")}`,
        applicationForm ? `Application form: ${applicationForm}` : "",
        requirementsPacket ? `Requirements packet: ${requirementsPacket}` : "",
        `More detail: /certification#${track.anchor}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    const requirementsPacket = docs.requirements?.href;
    const applicationForm = docs.application?.href;
    return [
      `${track.level}: ${track.summary}`,
      `Next step: ${track.progressionLabel}`,
      requirementsPacket ? `Requirements packet: ${requirementsPacket}` : "",
      applicationForm ? `Application form: ${applicationForm}` : "",
      `Certification hub section: /certification#${track.anchor}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (normalized.includes("credly") || normalized.includes("badge")) {
    const badging = certification.badging;
    return [
      `${badging.intro.beforeCredly}${badging.intro.credlyLabel}${badging.intro.afterCredly}`,
      badging.claimNote,
      "Learn more at `/certification#badges`. Coaches who add their public Credly badge link also get the badge displayed on their profile in the coach directory at `/coaches`.",
    ].join("\n\n");
  }

  if (normalized.includes("resource") || normalized.includes("library")) {
    return [
      "The public resources page is at `/resources`.",
      "It currently highlights verified WIAL-hosted materials, including brochures, articles, and case studies.",
    ].join("\n\n");
  }

  return [
    "I can help with CALC, PALC, SALC, MALC, recertification, application forms, LMS links, Credly badges, and general WIAL certification questions.",
    "Start with `/certification` for the full hub, or ask something specific like \"How do I renew PALC?\" or \"Where is the CALC application form?\"",
    "If you need direct help, contact `info@wial.org`.",
  ].join("\n\n");
}