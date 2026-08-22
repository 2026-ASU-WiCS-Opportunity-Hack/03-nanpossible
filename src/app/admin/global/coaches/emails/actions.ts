"use server";

import { revalidatePath } from "next/cache";
import { requireAccountViewer } from "@/lib/auth";
import {
  coachNamesMatch,
  isValidEmail,
  matchEmailRows,
  parseNameEmailRows,
  type CoachEmailMatch,
} from "@/lib/coach-email-import";
import { listCoachesForAdmin } from "@/lib/coaches";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";

const ROSTER_LIMIT = 2000;
const MAX_ROWS = 1000;

export type CoachEmailPreview = {
  matches: CoachEmailMatch[];
  truncated: boolean;
  error: string | null;
};

export async function previewCoachEmailsAction(
  text: string,
): Promise<CoachEmailPreview> {
  await requireAccountViewer("/admin/global/coaches/emails", ["platform_admin"]);

  const rows = parseNameEmailRows(text ?? "");
  const truncated = rows.length > MAX_ROWS;
  const limited = rows.slice(0, MAX_ROWS);

  if (!limited.length) {
    return {
      matches: [],
      truncated: false,
      error: "No rows found. Paste one name and email address per line.",
    };
  }

  const { coaches } = await listCoachesForAdmin({ limit: ROSTER_LIMIT });
  if (!coaches.length) {
    return {
      matches: [],
      truncated,
      error: "The coach roster could not be loaded right now.",
    };
  }

  return { matches: matchEmailRows(limited, coaches), truncated, error: null };
}

export type CoachEmailAssignment = {
  coachId: string;
  name: string;
  email: string;
};

export type CoachEmailApplyResult = {
  updated: number;
  skipped: { name: string; email: string; reason: string }[];
  error: string | null;
};

/**
 * Apply reviewed assignments. Everything is re-validated against the current
 * roster right before writing — a coach that gained an email (or changed
 * name) since the preview is skipped, an email already on any other coach is
 * refused, and each write itself is guarded with `.is("email", null)` so an
 * existing address can never be overwritten.
 */
export async function applyCoachEmailsAction(
  assignments: CoachEmailAssignment[],
): Promise<CoachEmailApplyResult> {
  await requireAccountViewer("/admin/global/coaches/emails", ["platform_admin"]);

  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return { updated: 0, skipped: [], error: "The database is unavailable right now." };
  }
  if (!assignments?.length) {
    return { updated: 0, skipped: [], error: "Nothing selected to apply." };
  }
  if (assignments.length > MAX_ROWS) {
    return { updated: 0, skipped: [], error: "Too many rows in one batch." };
  }

  const { data, error } = await client
    .from("coaches")
    .select("id, name, email")
    .limit(ROSTER_LIMIT);

  if (error || !data) {
    return { updated: 0, skipped: [], error: "The coach roster could not be loaded right now." };
  }

  const roster = new Map(
    data.map((row) => [row.id as string, row as { id: string; name: string; email: string | null }]),
  );
  const emailsInUse = new Set(
    data
      .map((row) => (row.email as string | null)?.trim().toLowerCase())
      .filter(Boolean),
  );
  const seenEmails = new Set<string>();
  const seenCoaches = new Set<string>();
  const skipped: CoachEmailApplyResult["skipped"] = [];
  let updated = 0;

  for (const assignment of assignments) {
    const email = assignment.email?.trim().toLowerCase() ?? "";
    const name = assignment.name?.trim() ?? "";
    const skip = (reason: string) => skipped.push({ name, email, reason });

    if (!isValidEmail(email)) {
      skip("Invalid email address.");
      continue;
    }
    if (seenEmails.has(email)) {
      skip("Duplicate email in this batch.");
      continue;
    }
    if (seenCoaches.has(assignment.coachId)) {
      skip("This coach appears twice in this batch.");
      continue;
    }

    const coach = roster.get(assignment.coachId);
    if (!coach) {
      skip("Coach no longer exists.");
      continue;
    }
    if (coach.email) {
      skip("This coach already has an email.");
      continue;
    }
    if (!name || !coachNamesMatch(name, coach.name)) {
      skip("The name no longer matches this coach — preview again.");
      continue;
    }
    if (emailsInUse.has(email)) {
      skip("Another coach already uses this email.");
      continue;
    }

    const { data: written, error: writeError } = await client
      .from("coaches")
      .update({ email })
      .eq("id", assignment.coachId)
      .is("email", null)
      .select("id");

    if (writeError || !written?.length) {
      skip("Saving failed — try again.");
      continue;
    }

    updated += 1;
    seenEmails.add(email);
    seenCoaches.add(assignment.coachId);
    emailsInUse.add(email);
  }

  if (updated > 0) {
    revalidatePath("/admin/global/coaches");
  }

  return { updated, skipped, error: null };
}
