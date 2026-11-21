import { addContactToNewsletterList, resolveConstantContactConfig } from "@/lib/constant-contact";
import type { NewsletterSource } from "@/lib/newsletter-fields";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";

export type NewsletterOutcome = { ok: boolean; stored: boolean; synced: boolean };

/**
 * Records a newsletter signup (#164): keeps our own row in
 * `newsletter_subscribers` so no signup is lost, then adds the contact to the
 * Constant Contact list when that connection is set up
 * (/admin/global/newsletter). Succeeds when either step worked; rows that did
 * not reach the list keep `synced_at` null and a `sync_error`. `email` must
 * already be normalized. Never throws.
 */
export async function subscribeToNewsletter(
  email: string,
  source: NewsletterSource,
): Promise<NewsletterOutcome> {
  const client = createServiceRoleSupabaseClient();
  let stored = false;

  if (client) {
    try {
      const { error } = await client
        .from("newsletter_subscribers")
        .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });
      if (error) {
        console.error("Newsletter: could not store the signup:", error.message);
      } else {
        stored = true;
      }
    } catch (error) {
      console.error("Newsletter: could not store the signup:", error);
    }
  }

  const config = await resolveConstantContactConfig().catch(() => null);
  let synced = false;
  let syncError: string | null = "not-configured";

  if (config) {
    const result = await addContactToNewsletterList(email, config);
    synced = result.ok;
    syncError = result.ok ? null : result.error;
    if (!result.ok) {
      console.error("Newsletter: Constant Contact rejected the signup:", result.error);
    }
  }

  if (client && stored) {
    try {
      await client
        .from("newsletter_subscribers")
        .update(
          synced
            ? { synced_at: new Date().toISOString(), sync_error: null }
            : { sync_error: syncError },
        )
        .eq("email", email)
        .is("synced_at", null);
    } catch {
      // The signup itself is stored; the sync marker is best effort.
    }
  }

  return { ok: stored || synced, stored, synced };
}

export type NewsletterStats = { total: number; waiting: number };

/** Signup counts for the admin page; null when the database is unavailable. */
export async function getNewsletterStats(): Promise<NewsletterStats | null> {
  const client = createServiceRoleSupabaseClient();
  if (!client) return null;
  try {
    const [total, waiting] = await Promise.all([
      client.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      client
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .is("synced_at", null),
    ]);
    if (total.error || waiting.error) return null;
    return { total: total.count ?? 0, waiting: waiting.count ?? 0 };
  } catch {
    return null;
  }
}

const SYNC_BATCH_SIZE = 100;

export type SyncWaitingResult = { attempted: number; sent: number } | "not-ready" | "unavailable";

/** Sends signups collected before the connection existed (oldest first, one batch per call). */
export async function syncWaitingSubscribers(): Promise<SyncWaitingResult> {
  const client = createServiceRoleSupabaseClient();
  if (!client) return "unavailable";
  const config = await resolveConstantContactConfig().catch(() => null);
  if (!config) return "not-ready";

  const { data, error } = await client
    .from("newsletter_subscribers")
    .select("email")
    .is("synced_at", null)
    .order("created_at", { ascending: true })
    .limit(SYNC_BATCH_SIZE);
  if (error) return "unavailable";

  let sent = 0;
  for (const row of data ?? []) {
    const result = await addContactToNewsletterList(row.email as string, config);
    await client
      .from("newsletter_subscribers")
      .update(
        result.ok
          ? { synced_at: new Date().toISOString(), sync_error: null }
          : { sync_error: result.error },
      )
      .eq("email", row.email as string);
    if (result.ok) {
      sent += 1;
    } else if (result.error === "authorization-failed") {
      // Every further call would fail the same way.
      break;
    }
  }

  return { attempted: data?.length ?? 0, sent };
}
