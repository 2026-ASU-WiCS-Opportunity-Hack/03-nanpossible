import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import { createSupabaseContentClient } from "@/lib/supabase";
import type { EventRecord } from "@/lib/types";

type EventRow = {
  id: string;
  chapter_id: string | null;
  title: string;
  start_at: string;
  end_at: string | null;
  location: string | null;
  description: string | null;
  link_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

const eventColumns = [
  "id",
  "chapter_id",
  "title",
  "start_at",
  "end_at",
  "location",
  "description",
  "link_url",
  "published",
  "created_at",
  "updated_at",
].join(", ");

function mapEventRow(row: EventRow): EventRecord {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    description: row.description,
    linkUrl: row.link_url,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listUpcomingEvents(
  chapterId: string,
  options: {
    limit?: number;
    tenantSubdomain?: string | null;
    publishedOnly?: boolean;
  } = {},
) {
  const client = createSupabaseContentClient({
    tenantSubdomain: options.tenantSubdomain,
  });

  if (!client) {
    return [] satisfies EventRecord[];
  }

  let query = client
    .from("events")
    .select(eventColumns)
    .eq("chapter_id", chapterId)
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(options.limit ?? 10);

  if (options.publishedOnly ?? true) {
    query = query.eq("published", true);
  }

  const { data } = await query;
  return ((data ?? []) as unknown as EventRow[]).map(mapEventRow);
}

export async function listEventsForAdmin(chapterId: string) {
  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return [] satisfies EventRecord[];
  }

  const { data } = await client
    .from("events")
    .select(eventColumns)
    .eq("chapter_id", chapterId)
    .order("start_at", { ascending: true });

  return ((data ?? []) as unknown as EventRow[]).map(mapEventRow);
}

export async function getEventByIdForAdmin(eventId: string) {
  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return null;
  }

  const { data } = await client
    .from("events")
    .select(eventColumns)
    .eq("id", eventId)
    .maybeSingle();

  return data ? mapEventRow(data as unknown as EventRow) : null;
}

/** Every event on the platform — affiliate and WIAL-wide — for platform admins. */
export async function listAllEventsForAdmin() {
  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return [] satisfies EventRecord[];
  }

  const { data } = await client
    .from("events")
    .select(eventColumns)
    .order("start_at", { ascending: true });

  return ((data ?? []) as unknown as EventRow[]).map(mapEventRow);
}

/**
 * Published events that have not finished yet, across all active affiliates
 * plus WIAL-wide ones, soonest first — the data behind the public `/events`
 * calendar. Read with the anon client, so row-level security is what keeps
 * drafts and events of inactive affiliates out.
 */
export async function listPublicCalendarEvents(options: { limit?: number } = {}) {
  const client = createSupabaseContentClient();

  if (!client) {
    return [] satisfies EventRecord[];
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await client
      .from("events")
      .select(eventColumns)
      .eq("published", true)
      .or(`start_at.gte.${now},end_at.gte.${now}`)
      .order("start_at", { ascending: true })
      .limit(options.limit ?? 300);

    if (error) {
      return [] satisfies EventRecord[];
    }

    return ((data ?? []) as unknown as EventRow[]).map(mapEventRow);
  } catch {
    return [] satisfies EventRecord[];
  }
}
