import { describe, expect, it } from "vitest";
import {
  buildEventPreviewList,
  createEmptyEventDraft,
  normalizeEventDraftForSave,
  normalizeEventLink,
} from "./events-workbench";
import type { EventRecord } from "./types";

describe("normalizeEventDraftForSave", () => {
  it("rejects incomplete event drafts", () => {
    expect(normalizeEventDraftForSave(createEmptyEventDraft("chapter-1")).ok).toBe(false);
  });

  it("normalizes valid event payloads", () => {
    const normalized = normalizeEventDraftForSave({
      id: null,
      chapterId: "chapter-1",
      title: " Action Learning Summit ",
      startAt: "2026-05-01T10:30",
      endAt: "2026-05-01T12:00",
      location: " Chicago ",
      description: " Hands-on workshop ",
      linkUrl: "",
      published: true,
    });

    expect(normalized.ok).toBe(true);

    if (normalized.ok) {
      expect(normalized.payload.title).toBe("Action Learning Summit");
      expect(normalized.payload.location).toBe("Chicago");
      expect(normalized.payload.description).toBe("Hands-on workshop");
      expect(normalized.payload.published).toBe(true);
    }
  });
});

describe("buildEventPreviewList", () => {
  it("injects the draft event into the public preview order", () => {
    const events: EventRecord[] = [
      {
        id: "2",
        chapterId: "chapter-1",
        title: "Later event",
        startAt: "2026-05-02T10:00:00.000Z",
        endAt: null,
        location: null,
        description: null,
        linkUrl: null,
        published: true,
        createdAt: "",
        updatedAt: "",
      },
    ];

    const previewEvents = buildEventPreviewList(
      {
        id: null,
        chapterId: "chapter-1",
        title: "Earlier draft",
        startAt: "2026-05-01T08:00",
        endAt: "",
        location: "",
        description: "",
        linkUrl: "",
        published: false,
      },
      events,
    );

    expect(previewEvents[0]?.title).toBe("Earlier draft");
    expect(previewEvents[1]?.title).toBe("Later event");
  });
});

describe("WIAL-wide events and links", () => {
  const base = {
    id: null,
    title: "Global conference",
    startAt: "2026-10-23T09:00",
    endAt: "",
    location: "",
    description: "",
    linkUrl: "",
    published: true,
  };

  it("accepts an event with no affiliate", () => {
    const normalized = normalizeEventDraftForSave({ ...base, chapterId: null });
    expect(normalized.ok).toBe(true);
    if (normalized.ok) {
      expect(normalized.payload.chapterId).toBeNull();
      expect(normalized.payload.linkUrl).toBeNull();
    }
  });

  it("rejects an end before the start", () => {
    const normalized = normalizeEventDraftForSave({
      ...base,
      chapterId: null,
      endAt: "2026-10-22T09:00",
    });
    expect(normalized).toEqual({ ok: false, error: "end-before-start" });
  });

  it("normalizes and validates the event link", () => {
    expect(normalizeEventLink("  ")).toBeNull();
    expect(normalizeEventLink("wial.org/tokyo")).toBe("https://wial.org/tokyo");
    expect(normalizeEventLink("https://jial.or.jp/event")).toBe("https://jial.or.jp/event");
    expect(normalizeEventLink("javascript:alert(1)")).toBe(false);
    expect(normalizeEventLink("not a link")).toBe(false);
    expect(
      normalizeEventDraftForSave({ ...base, chapterId: "c1", linkUrl: "mailto:a@b.co" }),
    ).toEqual({ ok: false, error: "invalid-link" });
  });
});
