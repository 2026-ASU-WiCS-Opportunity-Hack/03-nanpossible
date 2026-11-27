import {
  ConferencesError,
  conferencePageSlug,
  conferencePath,
  conferenceSlugFromPageSlug,
  CONFERENCE_SLUG_PREFIX,
  starterConferenceBody,
  type ConferenceDetails,
  type ConferenceRecord,
} from "@/lib/conferences-fields";
import { createSupabaseContentClient } from "@/lib/supabase";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import type { ContentBody } from "@/lib/types";

type ConferenceRow = {
  id: string;
  page_id: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  archived: boolean;
  page: {
    id: string;
    slug: string;
    title: string;
    published: boolean;
    body_richtext: Partial<ContentBody> | null;
  } | null;
};

const conferenceSelect =
  "id, page_id, start_date, end_date, location, archived, page:content_pages!inner(id, slug, title, published, body_richtext)";

function mapRow(row: ConferenceRow): ConferenceRecord | null {
  if (!row.page) {
    return null;
  }
  const slug = conferenceSlugFromPageSlug(row.page.slug);
  return {
    id: row.id,
    pageId: row.page_id,
    slug,
    path: conferencePath(slug),
    title: row.page.title,
    intro: String(row.page.body_richtext?.heroIntro ?? ""),
    published: row.page.published,
    archived: row.archived,
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location,
  };
}

function mapRows(rows: unknown): ConferenceRecord[] {
  return ((rows ?? []) as ConferenceRow[])
    .map(mapRow)
    .filter((conference): conference is ConferenceRecord => conference !== null);
}

/**
 * Conferences whose page is published, for the public site. Read with the
 * anon client; returns an empty list when the database is unreachable.
 */
export async function listPublishedConferences(): Promise<ConferenceRecord[]> {
  const client = createSupabaseContentClient();
  if (!client) {
    return [];
  }

  try {
    const { data, error } = await client
      .from("conferences")
      .select(conferenceSelect)
      .eq("page.published", true);
    return error ? [] : mapRows(data);
  } catch {
    return [];
  }
}

/** The published conference at `/conferences/<slug>`, or null. */
export async function getPublishedConferenceBySlug(slug: string) {
  const conferences = await listPublishedConferences();
  return conferences.find((conference) => conference.slug === slug) ?? null;
}

function adminClient() {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    throw new ConferencesError("db-unavailable");
  }
  return client;
}

/** Every conference, drafts included. */
export async function listConferencesForAdmin(): Promise<ConferenceRecord[]> {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return [];
  }
  const { data } = await client.from("conferences").select(conferenceSelect);
  return mapRows(data);
}

export async function getConferenceForAdmin(id: string) {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return null;
  }
  const { data } = await client
    .from("conferences")
    .select(conferenceSelect)
    .eq("id", id)
    .maybeSingle();
  return data ? mapRow(data as unknown as ConferenceRow) : null;
}

async function assertSlugFree(slug: string, exceptPageId?: string) {
  const { data, error } = await adminClient()
    .from("content_pages")
    .select("id")
    .is("chapter_id", null)
    .eq("slug", conferencePageSlug(slug));

  if (error) {
    throw new ConferencesError("save-failed");
  }
  if ((data ?? []).some((row) => row.id !== exceptPageId)) {
    throw new ConferencesError("slug-taken");
  }
}

/**
 * Create a conference as a hidden draft: its page (optionally starting from a
 * copy of another conference's content) and its details row.
 */
export async function createConference(input: {
  title: string;
  details: ConferenceDetails;
  copyFromId?: string | null;
}): Promise<{ id: string }> {
  const client = adminClient();
  const title = input.title.trim();
  if (!title) {
    throw new ConferencesError("title-required");
  }
  await assertSlugFree(input.details.slug);

  let sourceBody: ContentBody | null = null;
  if (input.copyFromId) {
    const source = await getConferenceForAdmin(input.copyFromId);
    if (source) {
      const { data } = await client
        .from("content_pages")
        .select("body_richtext")
        .eq("id", source.pageId)
        .maybeSingle();
      sourceBody = (data?.body_richtext as ContentBody | undefined) ?? null;
    }
  }

  const { data: page, error: pageError } = await client
    .from("content_pages")
    .insert({
      chapter_id: null,
      slug: conferencePageSlug(input.details.slug),
      title,
      published: false,
      body_richtext: starterConferenceBody(sourceBody),
      seo: {},
    })
    .select("id")
    .single();

  if (pageError || !page) {
    throw new ConferencesError("save-failed");
  }

  const { data: conference, error } = await client
    .from("conferences")
    .insert({
      page_id: page.id,
      start_date: input.details.startDate,
      end_date: input.details.endDate,
      location: input.details.location,
    })
    .select("id")
    .single();

  if (error || !conference) {
    // Do not leave a page behind that no conference points at.
    await client.from("content_pages").delete().eq("id", page.id);
    throw new ConferencesError("save-failed");
  }

  return { id: conference.id as string };
}

/** Update dates, location, archive status and web address. Returns the old and new paths. */
export async function updateConferenceDetails(
  id: string,
  details: ConferenceDetails,
  archived: boolean,
): Promise<{ previousPath: string; path: string }> {
  const client = adminClient();
  const existing = await getConferenceForAdmin(id);
  if (!existing) {
    throw new ConferencesError("not-found");
  }

  if (details.slug !== existing.slug) {
    await assertSlugFree(details.slug, existing.pageId);
    const { error: slugError } = await client
      .from("content_pages")
      .update({ slug: conferencePageSlug(details.slug) })
      .eq("id", existing.pageId)
      .like("slug", `${CONFERENCE_SLUG_PREFIX}%`);
    if (slugError) {
      throw new ConferencesError("save-failed");
    }
  }

  const { error } = await client
    .from("conferences")
    .update({
      start_date: details.startDate,
      end_date: details.endDate,
      location: details.location,
      archived,
    })
    .eq("id", id);
  if (error) {
    throw new ConferencesError("save-failed");
  }

  return { previousPath: existing.path, path: conferencePath(details.slug) };
}

export async function setConferenceArchived(id: string, archived: boolean) {
  const { data, error } = await adminClient()
    .from("conferences")
    .update({ archived })
    .eq("id", id)
    .select("id");
  if (error) {
    throw new ConferencesError("save-failed");
  }
  if (!data?.length) {
    throw new ConferencesError("not-found");
  }
}

/** Delete a conference and its page. Returns the path that stops existing. */
export async function deleteConference(id: string): Promise<{ path: string }> {
  const client = adminClient();
  const existing = await getConferenceForAdmin(id);
  if (!existing) {
    throw new ConferencesError("not-found");
  }

  // The conference row goes with its page (on delete cascade). The slug guard
  // keeps this from ever deleting a page that is not a conference page.
  const { error } = await client
    .from("content_pages")
    .delete()
    .eq("id", existing.pageId)
    .is("chapter_id", null)
    .like("slug", `${CONFERENCE_SLUG_PREFIX}%`);
  if (error) {
    throw new ConferencesError("save-failed");
  }

  return { path: existing.path };
}
