import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canEditChapter, getCurrentUser } from "@/lib/auth";
import { getEventByIdForAdmin } from "@/lib/events";
import { normalizeEventDraftForSave, type EventDraft } from "@/lib/events-workbench";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import { getChapterById } from "@/lib/tenant";
import type { UserProfile } from "@/lib/types";

function getTenantPaths(subdomain: string) {
  return [`/sites/${subdomain}`, `/sites/${subdomain}/events`];
}

/**
 * An event with no affiliate is a WIAL-wide event: only platform admins may
 * create, change or delete one. Affiliate events follow the affiliate's own
 * editing rules.
 */
function canEditEvent(viewer: UserProfile, chapterId: string | null) {
  return chapterId ? canEditChapter(viewer, chapterId) : viewer.role === "platform_admin";
}

/** Refresh every public page an event can appear on. */
async function revalidateEventPages(chapterId: string | null) {
  revalidatePath("/events");

  const chapter = chapterId ? await getChapterById(chapterId) : null;

  if (chapter) {
    for (const path of getTenantPaths(chapter.subdomain)) {
      revalidatePath(path);
    }
  }
}

function saveErrorMessage(code: "missing-fields" | "end-before-start" | "invalid-link") {
  switch (code) {
    case "end-before-start":
      return "The end time must be after the start time.";
    case "invalid-link":
      return "The event link must be a web address, such as https://example.org/event.";
    default:
      return "Title and start date are required.";
  }
}

export async function POST(request: Request) {
  const viewer = await getCurrentUser();

  if (!viewer) {
    return NextResponse.json({ error: "You must be signed in to edit events." }, { status: 401 });
  }

  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return NextResponse.json(
      { error: "The Supabase service-role configuration is missing." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as EventDraft | null;
  const normalized = normalizeEventDraftForSave(
    body ?? {
      id: null,
      chapterId: null,
      title: "",
      startAt: "",
      endAt: "",
      location: "",
      description: "",
      linkUrl: "",
      published: false,
    },
  );

  if (!normalized.ok) {
    return NextResponse.json({ error: saveErrorMessage(normalized.error) }, { status: 400 });
  }

  if (!canEditEvent(viewer, normalized.payload.chapterId)) {
    return NextResponse.json(
      {
        error: normalized.payload.chapterId
          ? "This account cannot edit events for the active affiliate."
          : "Only WIAL platform admins can edit WIAL-wide events.",
      },
      { status: 403 },
    );
  }

  if (normalized.payload.eventId) {
    const existing = await getEventByIdForAdmin(normalized.payload.eventId);
    if (!existing) {
      return NextResponse.json(
        { error: "WIAL could not find this event." },
        { status: 404 },
      );
    }
    if (existing.chapterId !== normalized.payload.chapterId) {
      return NextResponse.json(
        { error: "This event does not belong to the active affiliate." },
        { status: 403 },
      );
    }
  }

  const payload = {
    chapter_id: normalized.payload.chapterId,
    title: normalized.payload.title,
    start_at: normalized.payload.startAt,
    end_at: normalized.payload.endAt,
    location: normalized.payload.location,
    description: normalized.payload.description,
    link_url: normalized.payload.linkUrl,
    published: normalized.payload.published,
  };

  // Scoped to the owner as well as the id, so a mismatched pair can never
  // touch another affiliate's (or a WIAL-wide) event.
  const ownerId = normalized.payload.chapterId;
  const scopedUpdate = (eventId: string) => {
    const update = client.from("events").update(payload).eq("id", eventId);
    return ownerId ? update.eq("chapter_id", ownerId) : update.is("chapter_id", null);
  };
  const query = normalized.payload.eventId
    ? scopedUpdate(normalized.payload.eventId).select("id").single()
    : client.from("events").insert(payload).select("id").single();

  const { data, error } = await query;

  if (error || !data?.id) {
    return NextResponse.json({ error: "WIAL could not save this event." }, { status: 500 });
  }

  const savedEvent = await getEventByIdForAdmin(data.id);

  if (!savedEvent) {
    return NextResponse.json(
      { error: "WIAL could not load the saved event." },
      { status: 500 },
    );
  }

  await revalidateEventPages(savedEvent.chapterId);

  return NextResponse.json({
    event: savedEvent,
    savedAt: new Date().toISOString(),
  });
}

export async function DELETE(request: Request) {
  const viewer = await getCurrentUser();

  if (!viewer) {
    return NextResponse.json({ error: "You must be signed in to edit events." }, { status: 401 });
  }

  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return NextResponse.json(
      { error: "The Supabase service-role configuration is missing." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        chapterId?: string | null;
        eventId?: string;
      }
    | null;
  const chapterId = body?.chapterId ? String(body.chapterId) : null;
  const eventId = String(body?.eventId ?? "");

  if (!eventId) {
    return NextResponse.json({ error: "Choose an event to delete." }, { status: 400 });
  }

  if (!canEditEvent(viewer, chapterId)) {
    return NextResponse.json(
      {
        error: chapterId
          ? "This account cannot edit events for the active affiliate."
          : "Only WIAL platform admins can edit WIAL-wide events.",
      },
      { status: 403 },
    );
  }

  const existing = await getEventByIdForAdmin(eventId);
  if (!existing) {
    return NextResponse.json(
      { error: "WIAL could not find this event." },
      { status: 404 },
    );
  }
  if (existing.chapterId !== chapterId) {
    return NextResponse.json(
      { error: "This event does not belong to the active affiliate." },
      { status: 403 },
    );
  }

  const removal = client.from("events").delete().eq("id", eventId);
  const { error } = await (chapterId
    ? removal.eq("chapter_id", chapterId)
    : removal.is("chapter_id", null));

  if (error) {
    return NextResponse.json({ error: "WIAL could not delete this event." }, { status: 500 });
  }

  await revalidateEventPages(chapterId);

  return NextResponse.json({
    deletedEventId: eventId,
    savedAt: new Date().toISOString(),
  });
}
