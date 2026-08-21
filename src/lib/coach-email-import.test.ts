import { describe, expect, it } from "vitest";
import {
  coachNamesMatch,
  matchEmailRows,
  normalizeCoachName,
  parseNameEmailRows,
  type MatchableCoach,
} from "./coach-email-import";

function coach(overrides: Partial<MatchableCoach> & { id: string; name: string }): MatchableCoach {
  return {
    email: null,
    slug: null,
    locationCity: null,
    locationCountry: null,
    certLevel: null,
    ...overrides,
  };
}

describe("parseNameEmailRows", () => {
  it("parses comma, semicolon, and tab separated lines", () => {
    const rows = parseNameEmailRows(
      "Bea Carson,bea@example.com\nJoão Silva;joao@example.com\nAnn Lee\tann@example.com",
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ name: "Bea Carson", email: "bea@example.com" });
    expect(rows[1]).toMatchObject({ name: "João Silva", email: "joao@example.com" });
    expect(rows[2]).toMatchObject({ name: "Ann Lee", email: "ann@example.com" });
  });

  it("finds the email by shape regardless of column order", () => {
    const rows = parseNameEmailRows("bea@example.com,Bea Carson");
    expect(rows[0]).toMatchObject({ name: "Bea Carson", email: "bea@example.com" });
  });

  it("joins extra cells into the name, so Last, First, email works", () => {
    const rows = parseNameEmailRows('"Carson", "Bea", bea@example.com');
    expect(rows[0]).toMatchObject({ name: "Carson Bea", email: "bea@example.com" });
  });

  it("skips a header row and blank lines, keeps original line numbers", () => {
    const rows = parseNameEmailRows("Name,Email\n\nBea Carson,bea@example.com\n");
    expect(rows).toHaveLength(1);
    expect(rows[0].line).toBe(3);
  });

  it("lowercases emails and leaves rows without one for review", () => {
    const rows = parseNameEmailRows("Bea Carson,BEA@Example.COM\nNo Email Here");
    expect(rows[0].email).toBe("bea@example.com");
    expect(rows[1].email).toBeNull();
    expect(rows[1].name).toBe("No Email Here");
  });
});

describe("normalizeCoachName / coachNamesMatch", () => {
  it("ignores case, accents, punctuation, and extra spaces", () => {
    expect(normalizeCoachName("  Dr.  José-María  O'Neil ")).toBe(
      normalizeCoachName("dr jose maria o neil"),
    );
  });

  it("matches reversed word order (Last First vs First Last)", () => {
    expect(coachNamesMatch("Carson Bea", "Bea Carson")).toBe(true);
    expect(coachNamesMatch("Bea Carson", "Bea Carlson")).toBe(false);
  });
});

describe("matchEmailRows", () => {
  const roster = [
    coach({ id: "1", name: "Bea Carson", locationCity: "Reston", locationCountry: "United States" }),
    coach({ id: "2", name: "Ann Lee" }),
    coach({ id: "3", name: "Ann Lee", locationCountry: "Singapore" }),
    coach({ id: "4", name: "Sam Ito", email: "sam@old.example" }),
  ];

  function run(text: string) {
    return matchEmailRows(parseNameEmailRows(text), roster);
  }

  it("marks a unique no-email match as ready", () => {
    const [match] = run("Bea Carson,bea@example.com");
    expect(match.status).toBe("ready");
    expect(match.coach?.id).toBe("1");
  });

  it("marks shared names as ambiguous with all candidates", () => {
    const [match] = run("Ann Lee,ann@example.com");
    expect(match.status).toBe("ambiguous");
    expect(match.candidates.map((candidate) => candidate.id)).toEqual(["2", "3"]);
  });

  it("never overwrites an existing email", () => {
    const [conflict] = run("Sam Ito,sam@new.example");
    expect(conflict.status).toBe("conflict");
    const [alreadySet] = run("Sam Ito,sam@old.example");
    expect(alreadySet.status).toBe("already-set");
  });

  it("flags unknown names and rows without an email", () => {
    const [notFound, invalid] = run("Nobody Known,x@example.com\nJust A Name");
    expect(notFound.status).toBe("not-found");
    expect(invalid.status).toBe("invalid");
  });

  it("demotes duplicate emails and duplicate coach targets within a batch", () => {
    const [first, dupEmail, dupCoach] = run(
      "Bea Carson,bea@example.com\nAnn Lee,bea@example.com\nCarson Bea,bea2@example.com",
    );
    expect(first.status).toBe("ready");
    expect(dupEmail.status).toBe("duplicate");
    expect(dupCoach.status).toBe("duplicate");
  });
});
