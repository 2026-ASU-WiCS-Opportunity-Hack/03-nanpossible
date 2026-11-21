import { describe, expect, it } from "vitest";
import { buildContactNotificationEmail } from "@/lib/contact-notification";

const contact = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  country: "Poland",
  about: "Certification",
  message: "How do I enroll?",
  subscribedToNewsletter: false,
};

describe("buildContactNotificationEmail", () => {
  it("leads with the topic and includes every field", () => {
    const email = buildContactNotificationEmail(contact);
    expect(email.subject).toBe("[Certification] New contact message from Ada Lovelace");
    expect(email.text.split("\n")[0]).toBe("About: Certification");
    expect(email.text).toContain("Country: Poland");
    expect(email.text).toContain("Email: ada@example.com");
    expect(email.text).toContain("Newsletter opt-in: no");
    expect(email.text).toContain("How do I enroll?");
  });

  it("keeps the subject on one line", () => {
    const email = buildContactNotificationEmail({
      ...contact,
      name: "Eve\r\nBcc: x@example.com",
    });
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});
