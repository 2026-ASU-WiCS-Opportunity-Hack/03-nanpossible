// Pure helpers shared by the /pay pages, the admin payments page, and tests.
// Nothing here touches Stripe or the database.

export const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx",
  "vnd", "vuv", "xaf", "xof", "xpf",
]);

export const SUPPORTED_CURRENCIES: { code: string; label: string }[] = [
  { code: "usd", label: "US dollar (USD)" },
  { code: "eur", label: "Euro (EUR)" },
  { code: "gbp", label: "British pound (GBP)" },
  { code: "jpy", label: "Japanese yen (JPY)" },
  { code: "thb", label: "Thai baht (THB)" },
  { code: "brl", label: "Brazilian real (BRL)" },
  { code: "sgd", label: "Singapore dollar (SGD)" },
  { code: "aud", label: "Australian dollar (AUD)" },
  { code: "cad", label: "Canadian dollar (CAD)" },
];

/** Format a Stripe minor-unit amount ("15000", "usd") as "$150.00". */
export function formatMinorAmount(amount: number, currency: string, locale = "en-US"): string {
  const code = currency.toLowerCase();
  const major = ZERO_DECIMAL_CURRENCIES.has(code) ? amount : amount / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code.toUpperCase(),
    }).format(major);
  } catch {
    return `${major.toFixed(ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2)} ${code.toUpperCase()}`;
  }
}

/** Parse an admin-entered amount ("150", "150.50", "1,250") into Stripe minor units. */
export function toMinorUnits(input: string, currency: string): number | null {
  // Strip thousands separators and a leading currency symbol, but keep a minus so it is rejected below.
  const cleaned = input.replace(/[,\s]/g, "").replace(/^[^\d.\-]+/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  const major = Number(cleaned);
  if (!Number.isFinite(major) || major <= 0 || major > 1_000_000) {
    return null;
  }
  const minor = ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())
    ? Math.round(major)
    : Math.round(major * 100);
  return minor > 0 ? minor : null;
}

/** Preset donation amounts in minor units (cents): $10, $25, $50, $75, $100, $200. */
export const DONATION_PRESETS_MINOR = [1000, 2500, 5000, 7500, 10000, 20000];
export const DONATION_MIN_MINOR = 100;
export const DONATION_MAX_MINOR = 5_000_000;
export const DONATION_COMMENT_MAX = 500;

/**
 * Resolve a donor-chosen amount into minor units. `preset` is either one of
 * `DONATION_PRESETS_MINOR` (as a string) or `"other"`, in which case `custom`
 * is parsed as a free-entry USD amount. Returns null when the selection is
 * missing, unparsable, or outside the donation bounds.
 */
export function parseDonationAmount(preset: string, custom: string): number | null {
  const presetMinor = DONATION_PRESETS_MINOR.find((minor) => String(minor) === preset);
  if (presetMinor !== undefined) {
    return presetMinor;
  }
  if (preset !== "other") {
    return null;
  }
  const minor = toMinorUnits(custom, "usd");
  if (minor === null || minor < DONATION_MIN_MINOR || minor > DONATION_MAX_MINOR) {
    return null;
  }
  return minor;
}

/** Validate the shape of a Stripe secret/restricted key without revealing it. */
export function describeStripeKey(key: string | null | undefined): {
  valid: boolean;
  mode: "test" | "live" | null;
  lastFour: string | null;
} {
  const trimmed = key?.trim() ?? "";
  const match = trimmed.match(/^(?:sk|rk)_(test|live)_[A-Za-z0-9]{16,}$/);
  if (!match) {
    return { valid: false, mode: null, lastFour: null };
  }
  return { valid: true, mode: match[1] as "test" | "live", lastFour: trimmed.slice(-4) };
}
