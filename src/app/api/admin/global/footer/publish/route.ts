import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  parseGlobalFooterState,
  publishGlobalFooterDraft,
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
  const nextState = publishGlobalFooterDraft(currentState, body.content);
  const { error } = await client
    .from("content_pages")
    .update({
      body_json: nextState,
      published: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId)
    .eq("slug", "global-footer")
    .is("chapter_id", null);

  if (error) {
    console.error("Unable to publish global footer", error);
    return NextResponse.json({ error: "publish-failed" }, { status: 500 });
  }

  revalidatePath("/", "layout");
  revalidatePath("/");

  return NextResponse.json({
    published: nextState.published,
    success: true,
    updatedAt: new Date().toISOString(),
  });
}
