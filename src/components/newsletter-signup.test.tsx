import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import pages from "@/content/pages.json";
import type { ContentPageRecord } from "@/lib/types";

vi.mock("@/app/newsletter-actions", () => ({ subscribeToNewsletterAction: vi.fn() }));

import { renderSection } from "./content-page";
import { NewsletterSignup } from "./newsletter-signup";

describe("NewsletterSignup", () => {
  const html = renderToStaticMarkup(<NewsletterSignup defaultEmail="a@b.co" source="footer" />);

  it("is an inline form with a labelled email field and a Subscribe button", () => {
    expect(html).toMatch(/<label[^>]*for="([^"]+)"[^>]*>Email address<\/label>/);
    expect(html).toMatch(/<input[^>]*type="email"/);
    expect(html).toContain('value="a@b.co"');
    expect(html).toContain("Subscribe");
    expect(html).toContain('<input type="hidden" name="source" value="footer"/>');
  });

  it("states consent and links the privacy policy without leaving the site", () => {
    expect(html).toContain("Unsubscribe at any time");
    expect(html).toContain('href="/privacy"');
    expect(html).not.toContain("constantcontact.com");
  });
});

describe("home page newsletter section (#164)", () => {
  const home = (pages as ContentPageRecord[]).find(
    (page) => page.slug === "home" && page.chapterId === null,
  );

  it("replaced the off-site Constant Contact card with the inline capture", () => {
    expect(JSON.stringify(home)).not.toContain("constantcontact.com");
    const section = home?.bodyRichtext.sections.find((item) => item.type === "newsletter_signup");
    expect(section).toMatchObject({
      title: "Join our newsletter",
      body: "Get Action Learning insights, events and certification dates.",
    });
    const html = renderToStaticMarkup(<>{section ? renderSection(section) : null}</>);
    expect(html).toContain('id="newsletter"');
    expect(html).toContain("Subscribe");
  });
});
