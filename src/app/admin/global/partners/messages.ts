const notices: Record<string, string> = {
  created: "Partner added. It appears on the public Partners page within a few minutes.",
  saved: "Partner details saved.",
  shown: "Partner is now shown on the public Partners page.",
  hidden: "Partner is hidden from the public Partners page.",
  deleted: "Partner removed.",
};

const errors: Record<string, string> = {
  "name-required": "Enter the partner organization's name.",
  "invalid-website": "The website address must be a full web address, like https://example.org.",
  "invalid-logo-url": "The logo address must be a full web address or a path on this site.",
  "logo-too-large": "Logo files must be 2 MB or smaller.",
  "logo-type": "Logos must be PNG, JPEG, WebP, GIF, or SVG images.",
  "not-found": "That partner no longer exists.",
  "db-unavailable": "The database is not reachable right now, so partners cannot be changed.",
  "save-failed": "The change could not be saved. Please try again.",
};

export function partnerNotice(code: string | undefined) {
  return code ? notices[code] ?? null : null;
}

export function partnerError(code: string | undefined) {
  return code ? errors[code] ?? errors["save-failed"] : null;
}
