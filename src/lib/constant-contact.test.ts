import { describe, expect, it } from "vitest";
import {
  buildAuthorizeUrl,
  constantContactRedirectUri,
  mergeSettingsWithEnv,
  parseContactLists,
  parseStoredSettings,
  parseTokenResponse,
} from "@/lib/constant-contact";

const empty = { clientId: null, clientSecret: null, listId: null, listName: null };

describe("parseStoredSettings", () => {
  it("reads the saved settings and trims them", () => {
    expect(
      parseStoredSettings(
        JSON.stringify({ clientId: " id ", clientSecret: "secret", listId: "list", listName: "News" }),
      ),
    ).toEqual({ clientId: "id", clientSecret: "secret", listId: "list", listName: "News" });
  });

  it.each([null, "", "not json", "[]", JSON.stringify({ clientId: 5 })])(
    "treats %p as nothing saved",
    (raw) => {
      expect(parseStoredSettings(raw)).toEqual(empty);
    },
  );
});

describe("mergeSettingsWithEnv", () => {
  const env = {
    CONSTANT_CONTACT_CLIENT_ID: "env-id",
    CONSTANT_CONTACT_CLIENT_SECRET: "env-secret",
    CONSTANT_CONTACT_LIST_ID: "env-list",
  };

  it("prefers what the admin saved", () => {
    expect(mergeSettingsWithEnv({ ...empty, clientId: "saved-id", listId: "saved-list" }, env)).toEqual({
      clientId: "saved-id",
      clientSecret: "env-secret",
      listId: "saved-list",
      listName: null,
    });
  });

  it("works with no env vars at all", () => {
    expect(mergeSettingsWithEnv(empty, {})).toEqual(empty);
  });
});

describe("authorization", () => {
  it("uses https except on localhost", () => {
    expect(constantContactRedirectUri("chapterstack.org")).toBe(
      "https://chapterstack.org/admin/global/newsletter/callback",
    );
    expect(constantContactRedirectUri("localhost:3100")).toBe(
      "http://localhost:3100/admin/global/newsletter/callback",
    );
  });

  it("asks for contact access plus a refresh token, with %20-separated scopes", () => {
    const url = buildAuthorizeUrl({
      clientId: "abc",
      redirectUri: "https://chapterstack.org/admin/global/newsletter/callback",
      state: "xyz",
    });
    expect(url.startsWith("https://authz.constantcontact.com/oauth2/default/v1/authorize?")).toBe(true);
    expect(url).toContain("scope=contact_data%20offline_access");
    expect(url).not.toContain("+");
    const params = new URL(url).searchParams;
    expect(params.get("client_id")).toBe("abc");
    expect(params.get("response_type")).toBe("code");
    expect(params.get("state")).toBe("xyz");
    expect(params.get("redirect_uri")).toBe(
      "https://chapterstack.org/admin/global/newsletter/callback",
    );
  });
});

describe("parseTokenResponse", () => {
  it("reads the tokens and accepts expires_in as a string", () => {
    expect(
      parseTokenResponse({ access_token: "a", refresh_token: "r", expires_in: "28800" }),
    ).toEqual({ accessToken: "a", refreshToken: "r", expiresIn: 28800 });
  });

  it("tolerates a missing refresh token and a bad lifetime", () => {
    expect(parseTokenResponse({ access_token: "a", expires_in: "soon" })).toEqual({
      accessToken: "a",
      refreshToken: null,
      expiresIn: 3600,
    });
  });

  it("rejects payloads without an access token", () => {
    expect(parseTokenResponse({ error: "invalid_grant" })).toBeNull();
    expect(parseTokenResponse(null)).toBeNull();
  });
});

describe("parseContactLists", () => {
  it("returns id and name, skipping entries without an id", () => {
    expect(
      parseContactLists({
        lists: [{ list_id: "1", name: "General" }, { name: "broken" }, { list_id: "2" }],
        lists_count: 3,
      }),
    ).toEqual([
      { id: "1", name: "General" },
      { id: "2", name: "2" },
    ]);
  });

  it("returns nothing for an unexpected payload", () => {
    expect(parseContactLists(null)).toEqual([]);
    expect(parseContactLists({ lists: "nope" })).toEqual([]);
  });
});
