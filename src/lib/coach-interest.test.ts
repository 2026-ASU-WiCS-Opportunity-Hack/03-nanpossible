import { describe, expect, it } from "vitest";
import {
  buildCoachInterestEmail,
  coachLeadRecipients,
  parseCoachInterest,
} from "@/lib/coach-interest";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = {
  name: " Ada Lovelace ",
  email: "ada@example.com",
  phone: "",
  country: "poland",
  message: "I run leadership programs and want to certify.",
};

describe("parseCoachInterest", () => {
  it("accepts a complete submission and canonicalizes the country", () => {
    const result = parseCoachInterest(form({ ...valid, newsletter: "on" }));
    expect(result).toEqual({
      ok: true,
      lead: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: null,
        country: "Poland",
        message: valid.message,
        subscribedToNewsletter: true,
      },
    });
  });

  it("defaults the newsletter opt-in to off", () => {
    const result = parseCoachInterest(form(valid));
    expect(result.ok && result.lead.subscribedToNewsletter).toBe(false);
  });

  it.each([
    ["name", ""],
    ["email", "not-an-email"],
    ["country", "Atlantis"],
    ["message", "   "],
  ])("rejects a missing or invalid %s", (key, value) => {
    expect(parseCoachInterest(form({ ...valid, [key]: value })).ok).toBe(false);
  });
});

describe("buildCoachInterestEmail", () => {
  const parsed = parseCoachInterest(form({ ...valid, phone: "+48 123" }));
  if (!parsed.ok) throw new Error("fixture should parse");

  it("puts the country first in the subject and body", () => {
    const email = buildCoachInterestEmail(parsed.lead, null);
    expect(email.subject.startsWith("[Poland]")).toBe(true);
    expect(email.text.split("\n")[0]).toBe("COUNTRY: POLAND");
    expect(email.text).toContain("none on the roster");
    expect(email.text).toContain("Phone: +48 123");
  });

  it("names the matching affiliate when there is one", () => {
    const email = buildCoachInterestEmail(parsed.lead, {
      name: "WIAL Poland",
      url: "https://wial.pl",
    });
    expect(email.text).toContain("WIAL Poland (https://wial.pl)");
  });

  it("keeps the subject on one line", () => {
    const email = buildCoachInterestEmail(
      { ...parsed.lead, name: "Eve\r\nBcc: x@example.com" },
      null,
    );
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});

describe("coachLeadRecipients", () => {
  it("splits and filters the configured addresses", () => {
    expect(coachLeadRecipients("a@wial.org, b@wial.org;junk")).toEqual([
      "a@wial.org",
      "b@wial.org",
    ]);
    expect(coachLeadRecipients(undefined)).toEqual([]);
  });
});
