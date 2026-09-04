import { describe, expect, it } from "vitest";
import {
  normalizeLogoUrl,
  normalizeWebsiteUrl,
  parsePartnerForm,
  partnerLocation,
  PartnersError,
  websiteHost,
} from "./partners-fields";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe("normalizeWebsiteUrl", () => {
  it("returns null for blanks and adds https to bare domains", () => {
    expect(normalizeWebsiteUrl("")).toBeNull();
    expect(normalizeWebsiteUrl("   ")).toBeNull();
    expect(normalizeWebsiteUrl("carson-consultants.com")).toBe("https://carson-consultants.com/");
    expect(normalizeWebsiteUrl("http://www.sri.vn")).toBe("http://www.sri.vn/");
  });

  it("rejects non-http schemes and hostless values", () => {
    expect(() => normalizeWebsiteUrl("javascript:alert(1)")).toThrow(PartnersError);
    expect(() => normalizeWebsiteUrl("not a url")).toThrow(PartnersError);
    expect(() => normalizeWebsiteUrl("localhost")).toThrow(PartnersError);
  });
});

describe("normalizeLogoUrl", () => {
  it("accepts vendored site paths and absolute http(s) URLs", () => {
    expect(normalizeLogoUrl("/partners/asio-consulting.webp")).toBe("/partners/asio-consulting.webp");
    expect(normalizeLogoUrl("https://cdn.example.org/logo.png")).toBe("https://cdn.example.org/logo.png");
    expect(normalizeLogoUrl("")).toBeNull();
  });

  it("rejects protocol-relative and non-http values", () => {
    expect(() => normalizeLogoUrl("//evil.example/logo.png")).toThrow(PartnersError);
    expect(() => normalizeLogoUrl("data:image/png;base64,AAAA")).toThrow(PartnersError);
  });
});

describe("partnerLocation", () => {
  it("joins the distinct parts in city, region, country order", () => {
    expect(
      partnerLocation({ city: "Annapolis", stateProvince: "Maryland", country: "United States" }),
    ).toBe("Annapolis, Maryland, United States");
    expect(partnerLocation({ city: "Singapore", stateProvince: null, country: "Singapore" })).toBe(
      "Singapore",
    );
    expect(partnerLocation({ city: null, stateProvince: null, country: null })).toBeNull();
  });
});

describe("websiteHost", () => {
  it("strips the scheme and www prefix", () => {
    expect(websiteHost("https://www.sri.vn/")).toBe("sri.vn");
    expect(websiteHost(null)).toBeNull();
  });
});

describe("parsePartnerForm", () => {
  it("requires a name", () => {
    expect(() => parsePartnerForm(form({ name: "  " }))).toThrow(
      expect.objectContaining({ code: "name-required" }),
    );
  });

  it("normalizes optional fields and reads the active checkbox", () => {
    const input = parsePartnerForm(
      form({
        name: " ASIO Consulting ",
        website: "asio.co.th",
        description: "",
        city: "Klongtoey",
        stateProvince: "Bangkok",
        country: "Thailand",
        logoUrl: "/partners/asio-consulting.webp",
        sortOrder: "20",
        active: "on",
      }),
    );
    expect(input).toEqual({
      name: "ASIO Consulting",
      websiteUrl: "https://asio.co.th/",
      description: null,
      city: "Klongtoey",
      stateProvince: "Bangkok",
      country: "Thailand",
      logoUrl: "/partners/asio-consulting.webp",
      sortOrder: 20,
      active: true,
    });
  });

  it("defaults sort order to 0 and active to false when the box is unchecked", () => {
    const input = parsePartnerForm(form({ name: "Learning Thru Action", sortOrder: "abc" }));
    expect(input.sortOrder).toBe(0);
    expect(input.active).toBe(false);
    expect(input.websiteUrl).toBeNull();
  });
});
