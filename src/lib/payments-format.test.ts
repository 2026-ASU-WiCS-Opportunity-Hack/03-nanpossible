import { describe, expect, it } from "vitest";
import {
  describeStripeKey,
  formatMinorAmount,
  parseDonationAmount,
  toMinorUnits,
} from "./payments-format";

describe("formatMinorAmount", () => {
  it("formats two-decimal currencies from minor units", () => {
    expect(formatMinorAmount(15000, "usd")).toBe("$150.00");
    expect(formatMinorAmount(1999, "eur", "en-US")).toBe("€19.99");
  });

  it("does not divide zero-decimal currencies", () => {
    expect(formatMinorAmount(5000, "jpy")).toBe("¥5,000");
  });
});

describe("toMinorUnits", () => {
  it("converts decimal input to cents", () => {
    expect(toMinorUnits("150", "usd")).toBe(15000);
    expect(toMinorUnits("150.50", "usd")).toBe(15050);
    expect(toMinorUnits("1,250.00", "usd")).toBe(125000);
    expect(toMinorUnits("$99.99", "usd")).toBe(9999);
  });

  it("keeps whole units for zero-decimal currencies", () => {
    expect(toMinorUnits("5000", "jpy")).toBe(5000);
  });

  it("rejects zero, negatives, garbage, and too many decimals", () => {
    expect(toMinorUnits("0", "usd")).toBeNull();
    expect(toMinorUnits("-5", "usd")).toBeNull();
    expect(toMinorUnits("abc", "usd")).toBeNull();
    expect(toMinorUnits("1.234", "usd")).toBeNull();
    expect(toMinorUnits("", "usd")).toBeNull();
  });
});

describe("describeStripeKey", () => {
  it("recognizes test and live secret keys and exposes only the last four characters", () => {
    expect(describeStripeKey("sk_test_51AbCdEfGhIjKlMnOpQrStUvWx")).toEqual({
      valid: true,
      mode: "test",
      lastFour: "UvWx",
    });
    // Assembled at runtime so the fixture never looks like a real live key to secret scanners.
    const liveKey = ["rk", "live", "51AbCdEfGhIjKlMnOpQrStUvWx"].join("_");
    expect(describeStripeKey(liveKey).mode).toBe("live");
  });

  it("rejects publishable keys, short strings, and empty values", () => {
    expect(describeStripeKey("pk_test_51AbCdEfGhIjKlMnOpQrStUvWx").valid).toBe(false);
    expect(describeStripeKey("sk_test_short").valid).toBe(false);
    expect(describeStripeKey("").valid).toBe(false);
    expect(describeStripeKey(null).valid).toBe(false);
  });
});

describe("parseDonationAmount", () => {
  it("accepts a preset amount", () => {
    expect(parseDonationAmount("2500", "")).toBe(2500);
    expect(parseDonationAmount("20000", "")).toBe(20000);
  });

  it("parses a valid 'other' amount", () => {
    expect(parseDonationAmount("other", "25")).toBe(2500);
    expect(parseDonationAmount("other", "25.50")).toBe(2550);
    expect(parseDonationAmount("other", "$1,000")).toBe(100000);
  });

  it("rejects a missing or unparsable amount", () => {
    expect(parseDonationAmount("", "25")).toBeNull();
    expect(parseDonationAmount("other", "abc")).toBeNull();
    expect(parseDonationAmount("other", "")).toBeNull();
  });

  it("rejects amounts outside the donation bounds", () => {
    expect(parseDonationAmount("other", "0.50")).toBeNull();
    expect(parseDonationAmount("other", "60000")).toBeNull();
  });
});
