"use client";

import { useMemo, useState, useTransition } from "react";
import type { CoachEmailCandidate, CoachEmailMatch } from "@/lib/coach-email-import";
import {
  applyCoachEmailsAction,
  previewCoachEmailsAction,
  type CoachEmailApplyResult,
  type CoachEmailAssignment,
  type CoachEmailPreview,
} from "./actions";

const STATUS_LABELS: Record<CoachEmailMatch["status"], string> = {
  ready: "Ready",
  ambiguous: "Needs a choice",
  "already-set": "Already set",
  conflict: "Has a different email",
  "not-found": "No match",
  duplicate: "Duplicate",
  invalid: "Can't read",
};

const STATUS_TONES: Record<CoachEmailMatch["status"], string> = {
  ready: "border-emerald-300 bg-emerald-50 text-emerald-800",
  ambiguous: "border-amber-300 bg-amber-50 text-amber-800",
  "already-set": "border-line bg-white/70 text-foreground/60",
  conflict: "border-orange-300 bg-orange-50 text-orange-800",
  "not-found": "border-line bg-white/70 text-foreground/60",
  duplicate: "border-orange-300 bg-orange-50 text-orange-800",
  invalid: "border-line bg-white/70 text-foreground/60",
};

function candidateSummary(candidate: CoachEmailCandidate) {
  return [candidate.location, candidate.certLevel, candidate.slug]
    .filter(Boolean)
    .join(" · ");
}

export function EmailImportWorkbench() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<CoachEmailPreview | null>(null);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const [applied, setApplied] = useState<CoachEmailApplyResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const assignments = useMemo<CoachEmailAssignment[]>(() => {
    if (!preview) {
      return [];
    }
    const list: CoachEmailAssignment[] = [];
    for (const match of preview.matches) {
      if (!match.email || !match.name) {
        continue;
      }
      if (match.status === "ready" && match.coach) {
        list.push({ coachId: match.coach.id, name: match.name, email: match.email });
      }
      if (match.status === "ambiguous") {
        const chosen = match.candidates.find(
          (candidate) => candidate.id === choices[match.line] && !candidate.hasEmail,
        );
        if (chosen) {
          list.push({ coachId: chosen.id, name: match.name, email: match.email });
        }
      }
    }
    return list;
  }, [preview, choices]);

  const counts = useMemo(() => {
    const tally = new Map<string, number>();
    for (const match of preview?.matches ?? []) {
      tally.set(match.status, (tally.get(match.status) ?? 0) + 1);
    }
    return tally;
  }, [preview]);

  function loadFile(file: File | null) {
    if (!file) {
      return;
    }
    void file.text().then((content) => {
      setText(content);
      setPreview(null);
      setApplied(null);
    });
  }

  function runPreview() {
    startTransition(async () => {
      const result = await previewCoachEmailsAction(text);
      setPreview(result);
      setChoices({});
      setApplied(null);
    });
  }

  function runApply() {
    const batch = assignments;
    startTransition(async () => {
      const result = await applyCoachEmailsAction(batch);
      setApplied(result);
      if (result.updated > 0) {
        setPreview(null);
        setChoices({});
        setText("");
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="space-y-4">
          <label className="field-shell">
            <span className="field-label">Names and email addresses</span>
            <textarea
              className="field-textarea min-h-[180px] font-mono text-sm"
              onChange={(event) => {
                setText(event.target.value);
                setApplied(null);
              }}
              placeholder={"One person per line, for example:\nBea Carson, bea@example.com\nJoão Silva; joao@example.com"}
              value={text}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="button-link ghost cursor-pointer">
              Upload a CSV instead
              <input
                accept=".csv,.txt,text/csv,text/plain"
                className="sr-only"
                onChange={(event) => loadFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <button
              className="button-link primary"
              disabled={isPending || !text.trim()}
              onClick={runPreview}
              type="button"
            >
              {isPending && !preview ? "Checking…" : "Preview matches"}
            </button>
          </div>
          <p className="text-sm text-foreground/60">
            Nothing is saved at this step. You&apos;ll review every match before
            any email is added, and coaches who already have an email are never
            changed.
          </p>
        </div>
      </section>

      {applied ? (
        <div
          className={`account-flash ${applied.error || applied.updated === 0 ? "is-error" : "is-success"}`}
        >
          {applied.error
            ? applied.error
            : `${applied.updated} ${applied.updated === 1 ? "email" : "emails"} added.`}
          {applied.skipped.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {applied.skipped.map((entry, index) => (
                <li key={index}>
                  {entry.name || entry.email}: {entry.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {preview ? (
        <section className="site-panel rounded-[2rem] p-6 md:p-8">
          {preview.error ? (
            <div className="account-flash is-error">{preview.error}</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(STATUS_LABELS).map(([status, label]) =>
                    counts.get(status) ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${STATUS_TONES[status as CoachEmailMatch["status"]]}`}
                        key={status}
                      >
                        {counts.get(status)} {label}
                      </span>
                    ) : null,
                  )}
                </div>
                <button
                  className="button-link primary"
                  disabled={isPending || assignments.length === 0}
                  onClick={runApply}
                  type="button"
                >
                  {isPending
                    ? "Saving…"
                    : `Add ${assignments.length} ${assignments.length === 1 ? "email" : "emails"}`}
                </button>
              </div>

              {preview.truncated ? (
                <p className="mt-3 text-sm text-foreground/60">
                  Only the first 1,000 lines were checked — run the rest as a
                  second batch.
                </p>
              ) : null}

              <div className="mt-5 grid gap-3">
                {preview.matches.map((match) => (
                  <div
                    className="rounded-[1.25rem] border border-line/60 bg-white/55 px-4 py-3"
                    key={match.line}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {match.name ?? "(no name)"}{" "}
                          <span className="font-normal text-foreground/60">
                            {match.email ?? ""}
                          </span>
                        </p>
                        <p className="text-sm text-foreground/60">
                          Line {match.line}: {match.note}
                          {match.coach && match.status !== "ready"
                            ? ` (${match.coach.name}${candidateSummary(match.coach) ? ` — ${candidateSummary(match.coach)}` : ""})`
                            : ""}
                        </p>
                        {match.status === "ready" && match.coach ? (
                          <p className="text-sm text-foreground/70">
                            → {match.coach.name}
                            {candidateSummary(match.coach)
                              ? ` — ${candidateSummary(match.coach)}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${STATUS_TONES[match.status]}`}
                      >
                        {STATUS_LABELS[match.status]}
                      </span>
                    </div>

                    {match.status === "ambiguous" ? (
                      <label className="field-shell mt-3">
                        <span className="field-label">Which coach is this?</span>
                        <select
                          className="field-input"
                          onChange={(event) =>
                            setChoices((current) => ({
                              ...current,
                              [match.line]: event.target.value,
                            }))
                          }
                          value={choices[match.line] ?? ""}
                        >
                          <option value="">Skip this line</option>
                          {match.candidates.map((candidate) => (
                            <option
                              disabled={candidate.hasEmail}
                              key={candidate.id}
                              value={candidate.id}
                            >
                              {candidate.name}
                              {candidateSummary(candidate)
                                ? ` — ${candidateSummary(candidate)}`
                                : ""}
                              {candidate.hasEmail ? " (already has an email)" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
