"use server";

import { redirect } from "next/navigation";
import { resolvePostAuthPath } from "@/lib/auth";
import { linkCoachAccountByEmail } from "@/lib/coaches";
import { createServerSupabaseAuthClient, hasSupabaseAuthConfig } from "@/lib/supabase-auth";

function buildLoginPath(
  nextPath: string,
  params: Record<string, string>,
) {
  const searchParams = new URLSearchParams({
    next: nextPath,
    ...params,
  });

  return `/login?${searchParams.toString()}`;
}

export async function signInWithPasswordAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = resolvePostAuthPath(String(formData.get("next") ?? ""));

  if (!username) {
    redirect(buildLoginPath(nextPath, { error: "username-required" }));
  }

  if (!password) {
    redirect(buildLoginPath(nextPath, { error: "password-required" }));
  }

  if (!hasSupabaseAuthConfig()) {
    redirect(buildLoginPath(nextPath, { error: "missing-config" }));
  }

  const supabase = await createServerSupabaseAuthClient();

  if (!supabase) {
    redirect(buildLoginPath(nextPath, { error: "missing-config" }));
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: username,
    password,
  });

  if (error) {
    redirect(buildLoginPath(nextPath, { error: "invalid-credentials" }));
  }

  // Signing in proves the email is confirmed, so an unclaimed coach directory
  // profile with this address can safely link to the account. Never blocks
  // the login itself.
  if (data.user?.email) {
    try {
      const linked = await linkCoachAccountByEmail(data.user.id, data.user.email);

      if (linked) {
        await supabase.auth.refreshSession();
      }
    } catch (linkError) {
      console.error("signInWithPasswordAction coach link failed", linkError);
    }
  }

  redirect(nextPath);
}
