import type { EventRecord } from "@/lib/types";

export type EventDraft = {
  id: string | null;
  /** `null` for a WIAL-wide event (platform admins only). */
  chapterId: string | null;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  description: string;
  linkUrl: string;
  published: boolean;
};

/**
 * Accepts a pasted web address with or without `https://`. Returns `null`
 * for an empty value and `false` for anything that is not an http(s) URL.
 */
export function normalizeEventLink(value: string): string | null | false {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    const isWeb = url.protocol === "https:" || url.protocol === "http:";
    return isWeb && url.hostname.includes(".") ? url.toString() : false;
  } catch {
    return false;
  }
}

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function createEmptyEventDraft(chapterId: string | null): EventDraft {
  return {
    id: null,
    chapterId,
    title: "",
    startAt: "",
    endAt: "",
    location: "",
    description: "",
    linkUrl: "",
    published: false,
  };
}

export function createEventDraft(event: EventRecord): EventDraft {
  return {
    id: event.id,
    chapterId: event.chapterId,
    title: event.title,
    startAt: toDateTimeLocalValue(event.startAt),
    endAt: toDateTimeLocalValue(event.endAt),
    location: event.location ?? "",
    description: event.description ?? "",
    linkUrl: event.linkUrl ?? "",
    published: event.published,
  };
}

export function normalizeEventDraftForSave(draft: EventDraft) {
  const title = draft.title.trim();
  const startAt = draft.startAt.trim();
  const endAt = draft.endAt.trim();
  const location = draft.location.trim();
  const description = draft.description.trim();

  // `chapterId` may be null (a WIAL-wide event); who is allowed to save one is
  // decided by the API route, not here.
  if (!title || !startAt) {
    return {
      ok: false,
      error: "missing-fields",
    } as const;
  }

  const startAtDate = new Date(startAt);

  if (Number.isNaN(startAtDate.getTime())) {
    return {
      ok: false,
      error: "missing-fields",
    } as const;
  }

  const endAtDate = endAt ? new Date(endAt) : null;

  if (endAtDate && Number.isNaN(endAtDate.getTime())) {
    return {
      ok: false,
      error: "missing-fields",
    } as const;
  }

  if (endAtDate && endAtDate.getTime() < startAtDate.getTime()) {
    return {
      ok: false,
      error: "end-before-start",
    } as const;
  }

  const linkUrl = normalizeEventLink(draft.linkUrl ?? "");

  if (linkUrl === false) {
    return {
      ok: false,
      error: "invalid-link",
    } as const;
  }

  return {
    ok: true,
    payload: {
      eventId: draft.id,
      chapterId: draft.chapterId || null,
      title,
      startAt: startAtDate.toISOString(),
      endAt: endAtDate ? endAtDate.toISOString() : null,
      location: location || null,
      description: description || null,
      linkUrl,
      published: draft.published,
    },
  } as const;
}

export function buildEventPreviewList(
  draft: EventDraft,
  events: EventRecord[],
) {
  const normalized = normalizeEventDraftForSave(draft);
  const visibleEvents = draft.id
    ? events.filter((event) => event.id !== draft.id)
    : [...events];

  if (!normalized.ok) {
    return visibleEvents.sort((left, right) => left.startAt.localeCompare(right.startAt));
  }

  const draftEvent: EventRecord = {
    id: draft.id ?? "draft-preview",
    chapterId: draft.chapterId,
    title: normalized.payload.title,
    startAt: normalized.payload.startAt,
    endAt: normalized.payload.endAt,
    location: normalized.payload.location,
    description: normalized.payload.description,
    linkUrl: normalized.payload.linkUrl,
    published: draft.published,
    createdAt: "",
    updatedAt: "",
  };

  return [...visibleEvents, draftEvent].sort((left, right) =>
    left.startAt.localeCompare(right.startAt),
  );
}
