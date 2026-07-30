import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  parseGlobalFooterState,
  saveGlobalFooterDraft,
} from "@/lib/global-footer";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const viewer = await getCurrentUser();

  if (!viewer) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (viewer.role !== "platform_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return NextResponse.json({ error: "missing-config" }, { status: 500 });
  }

  const body = (await request.json()) as {
    page_id?: string;
    content?: unknown;
  };
  const pageId = String(body.page_id ?? "");

  if (!pageId) {
    return NextResponse.json({ error: "missing-page" }, { status: 400 });
  }

  const { data: footerPage, error: lookupError } = await client
    .from("content_pages")
    .select("id, body_json")
    .eq("id", pageId)
    .eq("slug", "global-footer")
    .eq("is_global", true)
    .is("chapter_id", null)
    .maybeSingle();

  if (lookupError) {
    console.error("Unable to find global footer", lookupError);
    return NextResponse.json({ error: "lookup-failed" }, { status: 500 });
  }

  if (!footerPage) {
    return NextResponse.json({ error: "footer-not-found" }, { status: 404 });
  }

  const currentState = parseGlobalFooterState(footerPage.body_json);
  const nextState = saveGlobalFooterDraft(currentState, body.content);
  const { error } = await client
    .from("content_pages")
    .update({
      body_json: nextState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId)
    .eq("slug", "global-footer")
    .is("chapter_id", null);

  if (error) {
    console.error("Unable to save global footer draft", error);
    return NextResponse.json({ error: "save-failed" }, { status: 500 });
  }

  return NextResponse.json({
    draft: nextState.draft,
    success: true,
    savedAt: new Date().toISOString(),
  });
}
