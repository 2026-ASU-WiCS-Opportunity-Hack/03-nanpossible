import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { requireAccountViewer } from "@/lib/auth";
import {
  CONSTANT_CONTACT_CALLBACK_PATH,
  completeConstantContactAuthorization,
  constantContactRedirectUri,
} from "@/lib/constant-contact";

const ADMIN_PATH = "/admin/global/newsletter";
const STATE_COOKIE = "cc_oauth_state";

/**
 * Where Constant Contact returns the admin after they approve access. Checks
 * the state value set when the flow started, swaps the code for tokens, and
 * goes back to the settings page with the outcome.
 */
export async function GET(request: NextRequest) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const origin = constantContactRedirectUri(host).slice(0, -CONSTANT_CONTACT_CALLBACK_PATH.length);
  const finish = (params: Record<string, string>) => {
    const response = NextResponse.redirect(
      `${origin}${ADMIN_PATH}?${new URLSearchParams(params).toString()}`,
    );
    response.cookies.delete({ name: STATE_COOKIE, path: CONSTANT_CONTACT_CALLBACK_PATH });
    return response;
  };

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = (await cookies()).get(STATE_COOKIE)?.value;

  if (params.get("error")) {
    return finish({ error: "authorization-denied" });
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return finish({ error: "authorization-expired" });
  }

  const result = await completeConstantContactAuthorization(code, constantContactRedirectUri(host));
  return finish(result === "connected" ? { notice: "connected" } : { error: result });
}
