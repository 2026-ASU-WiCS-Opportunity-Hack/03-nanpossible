const notices: Record<string, string> = {
  created:
    "Conference created as a draft. Add its content below, then tick “Visible on the public site” and save to publish it.",
  saved: "Conference details saved.",
  archived: "Conference moved to the archive.",
  restored: "Conference moved back to upcoming.",
  deleted: "Conference deleted.",
};

const errors: Record<string, string> = {
  "title-required": "Enter the conference name.",
  "slug-required": "Enter a web address for the conference page, such as 2027-sao-paulo.",
  "slug-taken": "Another conference already uses that web address. Choose a different one.",
  "invalid-date": "Enter the dates as a valid calendar date.",
  "end-before-start": "The last day must be on or after the first day.",
  "confirm-required": "Tick the box to confirm before deleting the conference.",
  "not-found": "That conference no longer exists.",
  "db-unavailable": "The database is not reachable right now, so conferences cannot be changed.",
  "save-failed": "The change could not be saved. Please try again.",
};

export function conferenceNotice(code: string | undefined) {
  return code ? notices[code] ?? null : null;
}

export function conferenceError(code: string | undefined) {
  return code ? errors[code] ?? errors["save-failed"] : null;
}
