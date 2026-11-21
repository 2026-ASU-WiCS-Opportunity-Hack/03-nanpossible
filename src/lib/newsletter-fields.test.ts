import { describe, expect, it } from "vitest";
import { normalizeNewsletterEmail, resolveNewsletterSource } from "@/lib/newsletter-fields";

describe("normalizeNewsletterEmail", () => {
  it("trims and lower-cases a valid address", () => {
    expect(normalizeNewsletterEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it.each(["", "ada", "ada@example", "a b@example.com", null, 42])("rejects %p", (value) => {
    expect(normalizeNewsletterEmail(value)).toBeNull();
  });

  it("rejects addresses longer than the mailing list accepts", () => {
    expect(normalizeNewsletterEmail(`${"a".repeat(45)}@example.com`)).toBeNull();
  });
});

describe("resolveNewsletterSource", () => {
  it("keeps known sources and defaults the rest", () => {
    expect(resolveNewsletterSource("resources")).toBe("resources");
    expect(resolveNewsletterSource("nope")).toBe("footer");
    expect(resolveNewsletterSource(undefined)).toBe("footer");
  });
});
