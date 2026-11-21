import { addContactToNewsletterList, readConstantContactConfig } from "@/lib/constant-contact";
import type { NewsletterSource } from "@/lib/newsletter-fields";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";

export type NewsletterOutcome = { ok: boolean; stored: boolean; synced: boolean };

/**
 * Records a newsletter signup (#164): keeps our own row in
 * `newsletter_subscribers` so no signup is lost, then adds the contact to the
 * Constant Contact list when that integration is configured. Succeeds when
 * either step worked; rows that did not reach the list keep `synced_at` null
 * and a `sync_error`. `email` must already be normalized. Never throws.
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

  const config = readConstantContactConfig();
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
