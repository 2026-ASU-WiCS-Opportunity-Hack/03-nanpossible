import { countries } from "@/lib/countries";

/**
 * Pure helpers for the /become-a-coach interest form (#161): input
 * validation and the admin notification email. Kept free of I/O so the
 * server action stays thin and this stays unit-testable.
 */

export type CoachInterestLead = {
  name: string;
  email: string;
  phone: string | null;
  country: string;
  message: string;
  subscribedToNewsletter: boolean;
};

export type CoachInterestParseResult =
  | { ok: true; lead: CoachInterestLead }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 4000;

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Canonical country name for a submitted value, or null when it is not a known country. */
export function canonicalInterestCountry(value: string) {
  const key = value.trim().toLowerCase();
  return countries.find((country) => country.name.toLowerCase() === key)?.name ?? null;
}

export function parseCoachInterest(formData: FormData): CoachInterestParseResult {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  const country = canonicalInterestCountry(field(formData, "country"));
  const message = field(formData, "message");

  if (!name) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!country) {
    return { ok: false, error: "Please choose your country." };
  }
  if (!message) {
    return { ok: false, error: "Please tell us a little about your interest." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "Please shorten your message." };
  }

  return {
    ok: true,
    lead: {
      name,
      email,
      phone: phone || null,
      country,
      message,
      subscribedToNewsletter: formData.get("newsletter") === "on",
    },
  };
}

export type CoachInterestAffiliate = { name: string; url: string };

/** Single-line header value: strips CR/LF so user input cannot break the subject. */
function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Notification for the WIAL team. Country leads the subject and the body so
 * the inquiry can be forwarded to the matching affiliate at a glance.
 */
export function buildCoachInterestEmail(
  lead: CoachInterestLead,
  affiliate: CoachInterestAffiliate | null,
) {
  const affiliateLine = affiliate
    ? `WIAL affiliate in ${lead.country}: ${affiliate.name} (${affiliate.url})`
    : `WIAL affiliate in ${lead.country}: none on the roster — route through WIAL Global`;

  return {
    subject: oneLine(`[${lead.country}] New coach inquiry from ${lead.name}`),
    text: [
      `COUNTRY: ${lead.country.toUpperCase()}`,
      affiliateLine,
      "",
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      `Phone: ${lead.phone ?? "not provided"}`,
      `Newsletter opt-in: ${lead.subscribedToNewsletter ? "yes" : "no"}`,
      "",
      "Message:",
      lead.message,
      "",
      "Sent from the Become a Coach form.",
    ].join("\n"),
  };
}

/** Recipients from COACH_LEAD_NOTIFY_EMAILS (comma/space separated); empty when unset. */
export function coachLeadRecipients(raw: string | undefined) {
  return (raw ?? "")
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter((value) => EMAIL_PATTERN.test(value));
}
