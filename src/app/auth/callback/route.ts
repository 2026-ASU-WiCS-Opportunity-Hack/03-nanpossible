import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolvePostAuthPath } from "@/lib/auth";
import { linkCoachAccountByEmail } from "@/lib/coaches";
import { createServerSupabaseAuthClient, hasSupabaseAuthConfig } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = resolvePostAuthPath(requestUrl.searchParams.get("next"));

  if (!hasSupabaseAuthConfig()) {
    return NextResponse.redirect(
      new URL("/login?error=missing-config", requestUrl.origin),
    );
  }

  const supabase = await createServerSupabaseAuthClient();

  if (!supabase) {
    return NextResponse.redirect(
      new URL("/login?error=missing-config", requestUrl.origin),
    );
  }

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=callback-failed", requestUrl.origin),
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=callback-failed", requestUrl.origin),
      );
    }
  } else {
    return NextResponse.redirect(
      new URL("/login?error=callback-failed", requestUrl.origin),
    );
  }

  if (type === "recovery") {
    return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
  }

  // Reaching here means the email is confirmed, which is the requirement for
  // linking an unclaimed coach directory profile to this account.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    try {
      const linked = await linkCoachAccountByEmail(user.id, user.email);

      if (linked) {
        await supabase.auth.refreshSession();
      }
    } catch (error) {
      console.error("auth callback coach link failed", error);
    }
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
