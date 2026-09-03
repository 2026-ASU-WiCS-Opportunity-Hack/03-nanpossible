import { describe, expect, it } from "vitest";
import { describeStripeKey, formatMinorAmount, toMinorUnits } from "./payments-format";

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
