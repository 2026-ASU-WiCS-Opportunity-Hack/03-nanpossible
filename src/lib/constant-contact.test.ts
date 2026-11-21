import { describe, expect, it } from "vitest";
import { parseTokenResponse, readConstantContactConfig } from "@/lib/constant-contact";

const env = {
  CONSTANT_CONTACT_CLIENT_ID: "id",
  CONSTANT_CONTACT_CLIENT_SECRET: "secret",
  CONSTANT_CONTACT_LIST_ID: " list ",
  CONSTANT_CONTACT_REFRESH_TOKEN: "refresh",
};

describe("readConstantContactConfig", () => {
  it("returns the trimmed settings when all four are present", () => {
    expect(readConstantContactConfig(env)).toEqual({
      clientId: "id",
      clientSecret: "secret",
      listId: "list",
      refreshToken: "refresh",
    });
  });

  it.each(Object.keys(env))("is unconfigured without %s", (key) => {
    expect(readConstantContactConfig({ ...env, [key]: " " })).toBeNull();
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
