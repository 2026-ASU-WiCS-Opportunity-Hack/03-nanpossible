import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChapterRecord } from "@/lib/types";

const { getChapterBySubdomain } = vi.hoisted(() => ({
  getChapterBySubdomain: vi.fn(),
}));

vi.mock("@/lib/tenant", () => ({ getChapterBySubdomain }));

import { getLayoutSiteContext } from "@/lib/site-context";

const chapter = {
  id: "chapter-nigeria",
  name: "WIAL Nigeria",
  subdomain: "nigeria",
  region: "Africa",
  language: "en",
  country: "Nigeria",
  leadUserId: null,
  contactEmail: "contact@wial-nigeria.org",
  contactPhone: null,
  contactPhoneCountryCode: null,
  description: "The Nigeria affiliate",
  logoUrl: "/nigeria-logo.png",
  stripeAccountId: null,
  config: {},
  status: "active",
} as ChapterRecord;

describe("getLayoutSiteContext", () => {
  beforeEach(() => {
    getChapterBySubdomain.mockReset();
  });

  it("resolves the complete affiliate record when middleware headers are present", async () => {
    getChapterBySubdomain.mockResolvedValue(chapter);
    const headers = new Headers({
      host: "nigeria.wial.org",
      "x-chapter-id": chapter.id,
      "x-chapter-subdomain": chapter.subdomain,
      "x-chapter-name": chapter.name,
      "x-chapter-language": chapter.language,
    });

    const siteContext = await getLayoutSiteContext(headers);

    expect(getChapterBySubdomain).toHaveBeenCalledWith("nigeria");
    expect(siteContext).toEqual({
      isGlobal: false,
      tenant: chapter,
      host: "nigeria.wial.org",
    });
    expect(siteContext.tenant?.contactEmail).toBe("contact@wial-nigeria.org");
  });
});
