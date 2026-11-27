"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { AdminWorkbench } from "@/components/admin/AdminWorkbench";
import { UpcomingEvents } from "@/components/chapter/UpcomingEvents";
import { EventsCalendar } from "@/components/events-calendar";
import {
  GLOBAL_HOST_LABEL,
  buildCalendarEvents,
  type CalendarHost,
} from "@/lib/events-calendar";
import {
  buildEventPreviewList,
  createEmptyEventDraft,
  createEventDraft,
  type EventDraft,
} from "@/lib/events-workbench";
import { useEventCallback } from "@/lib/use-event";
import { getWorkbenchStatusCopy, type WorkbenchSaveState } from "@/lib/workbench";
import type { EventRecord } from "@/lib/types";

type EventWorkbenchProps = {
  /** The affiliate whose events are being edited; `null` on the global admin page. */
  chapterId: string | null;
  chapterSubdomain?: string;
  /**
   * Passed on the global admin page only: every affiliate's host details.
   * Its presence switches the workbench to "all events" mode — the list shows
   * events from every affiliate plus WIAL-wide ones, and new events are WIAL-wide.
   */
  calendarHosts?: Record<string, CalendarHost>;
  initialEvents: EventRecord[];
  initialSelectedEventId?: string | null;
};

function draftsAreEqual(left: EventDraft, right: EventDraft) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function formatEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function EventWorkbench({
  chapterId,
  chapterSubdomain,
  calendarHosts,
  initialEvents,
  initialSelectedEventId = null,
}: EventWorkbenchProps) {
  const isGlobal = calendarHosts !== undefined;
  const hostLabel = (eventChapterId: string | null) =>
    (eventChapterId && calendarHosts?.[eventChapterId]?.name) || GLOBAL_HOST_LABEL;
  // The global page opens on a blank WIAL-wide event rather than on whichever
  // affiliate's event happens to be first.
  const fallbackEvent = isGlobal ? null : (initialEvents[0] ?? null);
  const [events, setEvents] = useState(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents.find((event) => event.id === initialSelectedEventId)?.id ??
      fallbackEvent?.id ??
      null,
  );
  const [draft, setDraft] = useState<EventDraft>(() => {
    const selectedEvent =
      initialEvents.find((event) => event.id === initialSelectedEventId) ?? fallbackEvent;

    return selectedEvent ? createEventDraft(selectedEvent) : createEmptyEventDraft(chapterId);
  });
  const [saveState, setSaveState] = useState<WorkbenchSaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const canonicalDraft = selectedEvent
    ? createEventDraft(selectedEvent)
    : createEmptyEventDraft(chapterId);
  const isDirty = !draftsAreEqual(draft, canonicalDraft);
  const effectiveSaveState: WorkbenchSaveState =
    saveState === "error" ? "error" : isDirty && saveState !== "saving" ? "dirty" : saveState;
  const saveStatus = getWorkbenchStatusCopy(effectiveSaveState, {
    lastSavedAt,
  });

  useEffect(() => {
    const nextSelectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

    if (nextSelectedEvent) {
      setDraft(createEventDraft(nextSelectedEvent));
      setSaveState("idle");
      return;
    }

    setDraft(createEmptyEventDraft(chapterId));
    setSaveState("idle");
  }, [chapterId, events, selectedEventId]);

  const previewEvents = useMemo(() => buildEventPreviewList(draft, events), [draft, events]);
  // The global preview shows just the event being edited, as its calendar entry.
  const calendarPreview = useMemo(
    () =>
      buildCalendarEvents(
        previewEvents.filter((event) => event.id === (draft.id ?? "draft-preview")),
        calendarHosts ?? {},
      ),
    [calendarHosts, draft.id, previewEvents],
  );

  const selectEvent = useEventCallback((eventId: string | null) => {
    if (eventId === selectedEventId) {
      return;
    }

    if (
      isDirty &&
      !window.confirm("Discard unsaved changes to the current event?")
    ) {
      return;
    }

    setNotice(null);
    setSelectedEventId(eventId);
  });

  const handleSave = useEventCallback(async () => {
    setNotice(null);
    setSaveState("saving");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as {
        error?: string;
        event?: EventRecord;
        savedAt?: string;
      };

      if (!response.ok || !payload.event) {
        setSaveState("error");
        setNotice({
          message: payload.error ?? "WIAL could not save this event.",
          tone: "error",
        });
        return;
      }

      startTransition(() => {
        setEvents((currentEvents) => {
          const remainingEvents = currentEvents.filter(
            (event) => event.id !== payload.event?.id,
          );

          return [...remainingEvents, payload.event!].sort((left, right) =>
            left.startAt.localeCompare(right.startAt),
          );
        });
        setSelectedEventId(payload.event!.id);
        setLastSavedAt(payload.savedAt ?? new Date().toISOString());
        setSaveState("saved");
        setNotice({
          message: draft.id ? "Event updated." : "Event created.",
          tone: "success",
        });
      });
    } catch {
      setSaveState("error");
      setNotice({
        message: "WIAL could not save this event.",
        tone: "error",
      });
    }
  });

  const handleDelete = useEventCallback(async () => {
    if (!draft.id || !window.confirm("Delete this event?")) {
      return;
    }

    setNotice(null);
    setSaveState("saving");

    try {
      const response = await fetch("/api/events", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chapterId: draft.chapterId,
          eventId: draft.id,
        }),
      });
      const payload = (await response.json()) as {
        deletedEventId?: string;
        error?: string;
        savedAt?: string;
      };

      if (!response.ok || !payload.deletedEventId) {
        setSaveState("error");
        setNotice({
          message: payload.error ?? "WIAL could not delete this event.",
          tone: "error",
        });
        return;
      }

      startTransition(() => {
        setEvents((currentEvents) =>
          currentEvents.filter((event) => event.id !== payload.deletedEventId),
        );
        setSelectedEventId(null);
        setLastSavedAt(payload.savedAt ?? new Date().toISOString());
        setSaveState("saved");
        setNotice({
          message: "Event deleted.",
          tone: "success",
        });
      });
    } catch {
      setSaveState("error");
      setNotice({
        message: "WIAL could not delete this event.",
        tone: "error",
      });
    }
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") {
        return;
      }

      event.preventDefault();
      void handleSave();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return (
    <AdminWorkbench
      actions={
        <>
          <button
            className="button-link secondary"
            onClick={() => selectEvent(null)}
            type="button"
          >
            New event
          </button>
          {draft.id ? (
            <button
              className="button-link secondary"
              onClick={() => void handleDelete()}
              type="button"
            >
              Delete
            </button>
          ) : null}
          <button className="button-link primary" onClick={() => void handleSave()} type="button">
            {draft.id ? "Save changes" : isGlobal ? "Create WIAL-wide event" : "Create event"}
          </button>
        </>
      }
      editLabel="Event details"
      editPane={
        <div className="space-y-5">
          {notice ? (
            <div className={`account-flash ${notice.tone === "success" ? "is-success" : "is-error"}`}>
              {notice.message}
            </div>
          ) : null}

          {isGlobal ? (
            <p className="text-sm leading-6 text-foreground/70">
              <span className="font-semibold text-teal-deep">
                Organised by {hostLabel(draft.chapterId)}.
              </span>{" "}
              {draft.chapterId && calendarHosts?.[draft.chapterId]
                ? "This event belongs to an affiliate and also appears on that affiliate's site."
                : "This event is not tied to an affiliate and appears on the main events calendar."}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-shell">
              <span className="field-label">Title</span>
              <input
                className="field-input"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
                type="text"
                value={draft.title}
              />
            </label>

            <label className="field-shell">
              <span className="field-label">Location</span>
              <input
                className="field-input"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    location: event.target.value,
                  }))
                }
                type="text"
                value={draft.location}
              />
            </label>

            <label className="field-shell">
              <span className="field-label">Start</span>
              <input
                className="field-input"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    startAt: event.target.value,
                  }))
                }
                required
                type="datetime-local"
                value={draft.startAt}
              />
            </label>

            <label className="field-shell">
              <span className="field-label">End</span>
              <input
                className="field-input"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    endAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={draft.endAt}
              />
            </label>
          </div>

          <label className="field-shell">
            <span className="field-label">Description</span>
            <textarea
              className="field-textarea"
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  description: event.target.value,
                }))
              }
              rows={7}
              value={draft.description}
            />
          </label>

          <label className="field-shell">
            <span className="field-label">Event link (optional)</span>
            <input
              className="field-input"
              inputMode="url"
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  linkUrl: event.target.value,
                }))
              }
              placeholder="https://"
              type="text"
              value={draft.linkUrl}
            />
            <span className="mt-1.5 block text-sm text-foreground/60">
              A page where people can read more or register.
            </span>
          </label>

          <label className="coach-checkbox">
            <input
              checked={draft.published}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  published: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>
              {isGlobal
                ? "Show this event on the public events calendar"
                : "Show this event on the affiliate site and the WIAL events calendar"}
            </span>
          </label>
        </div>
      }
      liveHref={isGlobal || !chapterSubdomain ? "/events" : `/sites/${chapterSubdomain}`}
      previewHint={
        isGlobal
          ? "How this event will look on the public events calendar once it is published."
          : "Shown exactly as visitors will see it on the affiliate homepage."
      }
      previewLabel={isGlobal ? "Calendar preview" : "Homepage preview"}
      previewPane={
        isGlobal ? (
          <div className="rounded-[1.7rem] border border-line/70 bg-[rgba(255,252,248,0.88)] p-4">
            <EventsCalendar
              emptyMessage="Add a title and a start time to see the event here."
              events={calendarPreview}
              showFilters={false}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.7rem] border border-line/70 bg-[rgba(255,252,248,0.88)]">
            <UpcomingEvents events={previewEvents} />
          </div>
        )
      }
      rail={
        <div className="space-y-4 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Events</p>
            {events.length > 0 ? (
              <span className="rounded-full border border-line/80 bg-white/75 px-2.5 py-1 text-xs font-semibold text-foreground/56">
                {events.length}
              </span>
            ) : null}
          </div>

          <div className="grid gap-3">
            {events.map((event) => (
              <button
                className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${
                  selectedEventId === event.id
                    ? "border-teal/20 bg-white text-teal-deep shadow-[0_14px_36px_rgba(22,63,61,0.08)]"
                    : "border-line/75 bg-white/55 text-foreground/68 hover:bg-white/74 hover:text-teal-deep"
                }`}
                key={event.id}
                onClick={() => selectEvent(event.id)}
                type="button"
              >
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] ${
                    event.published
                      ? "border-[rgba(22,95,88,0.14)] bg-[rgba(22,95,88,0.08)] text-teal-deep"
                      : "border-[rgba(181,163,0,0.2)] bg-[rgba(181,163,0,0.1)] text-[#6f5e00]"
                  }`}
                >
                  {event.published ? "Published" : "Draft"}
                </span>
                <h3 className="mt-2.5 text-base font-semibold leading-6">
                  {event.title}
                </h3>
                <p className="mt-1.5 text-sm text-foreground/58">
                  {formatEventDate(event.startAt)}
                </p>
                {isGlobal ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">
                    {hostLabel(event.chapterId)}
                  </p>
                ) : null}
              </button>
            ))}

            {events.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-line/75 bg-white/38 px-4 py-5 text-sm leading-7 text-foreground/64">
                {isGlobal
                  ? "No events yet. Fill in the event details to create the first WIAL-wide event."
                  : "No events yet. Fill in the event details to create your first one."}
              </div>
            ) : null}
          </div>
        </div>
      }
      saveStatus={saveStatus}
      stageLabel={draft.published ? "Published" : "Draft"}
      stageTone={draft.published ? "success" : "warning"}
      title={draft.title.trim() || (draft.id ? "Untitled event" : "New event")}
    />
  );
}
