import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContactForm } from "./ContactForm";

describe("ContactForm About prefill", () => {
  it("pre-selects the requested topic", () => {
    const html = renderToStaticMarkup(<ContactForm defaultAbout="Programs" />);
    expect(html).toMatch(/<option value="Programs" selected(="")?>/);
    expect(html).not.toMatch(/<option value="Certification" selected/);
  });

  it("keeps the placeholder selected without a topic", () => {
    const html = renderToStaticMarkup(<ContactForm />);
    expect(html).toMatch(/<option value="" disabled(="")? selected(="")?>/);
    expect(html).toContain('<option value="Other">Other</option>');
  });
});
