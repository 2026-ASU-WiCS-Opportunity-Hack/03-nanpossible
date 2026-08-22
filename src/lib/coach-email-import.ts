/**
 * Parsing + matching for the bulk coach email import at
 * /admin/global/coaches/emails. Coach emails gate profile claiming
 * (getClaimableCoachByEmail), so matching is deliberately conservative:
 * a row only becomes assignable when it resolves to exactly one coach,
 * that coach has no email yet, and no other row targets the same coach
 * or reuses the same email. Everything else is surfaced for review.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ParsedEmailRow = {
  line: number;
  raw: string;
  name: string | null;
  email: string | null;
};

export type CoachEmailCandidate = {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  certLevel: string | null;
  hasEmail: boolean;
};

export type MatchableCoach = {
  id: string;
  name: string;
  email: string | null;
  slug: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  certLevel: string | null;
};

export type CoachEmailMatchStatus =
  | "ready"
  | "already-set"
  | "conflict"
  | "ambiguous"
  | "not-found"
  | "duplicate"
  | "invalid";

export type CoachEmailMatch = {
  line: number;
  raw: string;
  name: string | null;
  email: string | null;
  status: CoachEmailMatchStatus;
  note: string;
  coach: CoachEmailCandidate | null;
  candidates: CoachEmailCandidate[];
};

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalizeCoachName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,'’‘"()]/g, " ")
    .replace(/[\s-]+/g, " ")
    .trim();
}

/** Word-order-independent key so "Carson, Bea" still finds "Bea Carson". */
function nameTokenKey(name: string): string {
  return normalizeCoachName(name).split(" ").sort().join(" ");
}

/** True when two name spellings refer to the same normalized name. */
export function coachNamesMatch(a: string, b: string): boolean {
  const normA = normalizeCoachName(a);
  const normB = normalizeCoachName(b);
  if (!normA || !normB) {
    return false;
  }
  return normA === normB || nameTokenKey(a) === nameTokenKey(b);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

function stripQuotes(value: string): string {
  return value.trim().replace(/^["']+|["']+$/g, "").trim();
}

/**
 * Parse pasted or CSV text into name/email rows. Each line may use commas,
 * semicolons, or tabs; the email is found by shape (not position) and the
 * remaining cells form the name, so "Last, First, email" still works.
 * A header line (contains "email", no address) is skipped.
 */
export function parseNameEmailRows(text: string): ParsedEmailRow[] {
  const rows: ParsedEmailRow[] = [];
  const lines = text.split(/\r\n|\r|\n/);

  lines.forEach((rawLine, index) => {
    const raw = rawLine.trim();
    if (!raw) {
      return;
    }

    const delimiter = raw.includes("\t") ? "\t" : raw.includes(";") ? ";" : ",";
    const cells = raw.split(delimiter).map(stripQuotes).filter(Boolean);
    const emailCells = cells.filter((cell) => isValidEmail(cell));
    const nameCells = cells.filter((cell) => !isValidEmail(cell));

    if (emailCells.length === 0 && /email/i.test(raw) && rows.length === 0) {
      return; // header row
    }

    rows.push({
      line: index + 1,
      raw,
      name: nameCells.length ? nameCells.join(" ") : null,
      email: emailCells.length === 1 ? emailCells[0].toLowerCase() : null,
    });
  });

  return rows;
}

function toCandidate(coach: MatchableCoach): CoachEmailCandidate {
  const location = [coach.locationCity, coach.locationCountry]
    .filter(Boolean)
    .join(", ");
  return {
    id: coach.id,
    name: coach.name,
    slug: coach.slug,
    location: location || null,
    certLevel: coach.certLevel,
    hasEmail: Boolean(coach.email),
  };
}

/**
 * Classify every parsed row against the coach roster. Only "ready" rows are
 * assignable; ambiguous rows carry their candidates so an admin can resolve
 * them by hand, and duplicates within the batch are demoted so one email can
 * never be applied to two coaches (or two emails to one coach) in a run.
 */
export function matchEmailRows(
  rows: ParsedEmailRow[],
  coaches: MatchableCoach[],
): CoachEmailMatch[] {
  const byExact = new Map<string, MatchableCoach[]>();
  const byTokens = new Map<string, MatchableCoach[]>();
  for (const coach of coaches) {
    const exact = normalizeCoachName(coach.name);
    const tokens = nameTokenKey(coach.name);
    byExact.set(exact, [...(byExact.get(exact) ?? []), coach]);
    byTokens.set(tokens, [...(byTokens.get(tokens) ?? []), coach]);
  }

  const seenEmails = new Map<string, number>();
  const targetedCoaches = new Map<string, number>();

  return rows.map((row) => {
    const base = {
      line: row.line,
      raw: row.raw,
      name: row.name,
      email: row.email,
      coach: null,
      candidates: [] as CoachEmailCandidate[],
    };

    if (!row.email) {
      return {
        ...base,
        status: "invalid" as const,
        note: "No valid email address on this line.",
      };
    }
    if (!row.name) {
      return {
        ...base,
        status: "invalid" as const,
        note: "No name on this line.",
      };
    }

    const duplicateLine = seenEmails.get(row.email);
    if (duplicateLine !== undefined) {
      return {
        ...base,
        status: "duplicate" as const,
        note: `Same email already appears on line ${duplicateLine}.`,
      };
    }
    seenEmails.set(row.email, row.line);

    const matches =
      byExact.get(normalizeCoachName(row.name)) ??
      byTokens.get(nameTokenKey(row.name)) ??
      [];

    if (matches.length === 0) {
      return {
        ...base,
        status: "not-found" as const,
        note: "No coach with this name.",
      };
    }

    if (matches.length > 1) {
      return {
        ...base,
        status: "ambiguous" as const,
        note: `${matches.length} coaches share this name — pick one or skip.`,
        candidates: matches.map(toCandidate),
      };
    }

    const coach = matches[0];
    if (coach.email) {
      const same = coach.email.trim().toLowerCase() === row.email;
      return {
        ...base,
        status: same ? ("already-set" as const) : ("conflict" as const),
        note: same
          ? "This coach already has this email."
          : "This coach already has a different email — not changed.",
        coach: toCandidate(coach),
      };
    }

    const targetLine = targetedCoaches.get(coach.id);
    if (targetLine !== undefined) {
      return {
        ...base,
        status: "duplicate" as const,
        note: `This coach is already matched on line ${targetLine}.`,
        coach: toCandidate(coach),
      };
    }
    targetedCoaches.set(coach.id, row.line);

    return {
      ...base,
      status: "ready" as const,
      note: "Will set this coach's email.",
      coach: toCandidate(coach),
    };
  });
}
