"use client";

import Image from "next/image";
import { useMemo, useState, useSyncExternalStore } from "react";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { trackEvent } from "@/lib/analytics";
import {
  ALL_FILTER_KEY,
  GLOBAL_HOST_LABEL,
  buildCalendarFilters,
  filterCalendarEvents,
  formatEventBadge,
  formatEventWhen,
  groupEventsByMonth,
  type CalendarEvent,
} from "@/lib/events-calendar";

const SERVER_TIME_ZONE = "UTC";

const subscribeToNothing = () => () => {};
const getViewerTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || SERVER_TIME_ZONE;
const getServerTimeZone = () => SERVER_TIME_ZONE;

/**
 * The visitor's time zone. The server (and the first client render, so
 * hydration matches) uses UTC; the page then re-renders in local time.
 */
function useViewerTimeZone() {
  return useSyncExternalStore(subscribeToNothing, getViewerTimeZone, getServerTimeZone);
}

type EventsCalendarProps = {
  events: CalendarEvent[];
  /** Hide the affiliate filter (used by the admin preview). */
  showFilters?: boolean;
  emptyMessage?: string;
};

/**
 * Month-by-month agenda of WIAL-wide and affiliate events, with a filter per
 * organiser. Dates are shown in the visitor's own time zone.
 */
export function EventsCalendar({
  events,
  showFilters = true,
  emptyMessage = "No upcoming events are on the calendar right now. Please check back soon.",
}: EventsCalendarProps) {
  const timeZone = useViewerTimeZone();
  const [filterKey, setFilterKey] = useState(ALL_FILTER_KEY);
  const filters = useMemo(() => buildCalendarFilters(events), [events]);
  const activeKey = filters.some((filter) => filter.key === filterKey) ? filterKey : ALL_FILTER_KEY;
  const months = useMemo(
    () => groupEventsByMonth(filterCalendarEvents(events, activeKey), timeZone),
    [activeKey, events, timeZone],
  );

  if (events.length === 0) {
    return (
      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <p className="text-base leading-7 text-foreground/72">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <div className="grid gap-5">
      {showFilters && filters.length > 2 ? (
        <div aria-label="Show events from" className="flex flex-wrap gap-2" role="group">
          {filters.map((filter) => {
            const active = filter.key === activeKey;
            return (
              <button
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-teal-deep bg-teal-deep text-white"
                    : "border-line bg-white/70 text-foreground/72 hover:border-teal/40 hover:text-teal-deep"
                }`}
                key={filter.key}
                onClick={() => {
                  setFilterKey(filter.key);
                  trackEvent({
                    name: "select_content",
                    params: { content_type: "event_filter", content_id: filter.label },
                  });
                }}
                type="button"
              >
                {filter.label}
                <span className={`ml-2 text-xs ${active ? "text-white/75" : "text-foreground/50"}`}>
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {months.map((month) => (
        <section className="site-panel rounded-[2rem] p-6 md:p-8" key={month.key}>
          <h2 className="font-display text-2xl text-teal-deep md:text-3xl">{month.label}</h2>
          <ul className="mt-5 grid gap-3">
            {month.events.map((event) => (
              <EventEntry event={event} key={event.id} timeZone={timeZone} />
            ))}
          </ul>
        </section>
      ))}

      <p className="text-sm text-foreground/60">
        Dates and times are shown in your local time zone
        {timeZone === SERVER_TIME_ZONE ? "" : ` (${timeZone.replace(/_/g, " ")})`}.
      </p>
    </div>
  );
}

function EventEntry({ event, timeZone }: { event: CalendarEvent; timeZone: string }) {
  const badge = formatEventBadge(event.startAt, timeZone);
  const host = event.host;

  return (
    <li className="feature-card feature-card--flat flex flex-col gap-4 rounded-[1.35rem] sm:flex-row sm:gap-5">
      <div
        aria-hidden="true"
        className="flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-[1.1rem] border border-line bg-white text-teal-deep"
      >
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-accent">
          {badge.month}
        </span>
        <span className="text-2xl font-semibold leading-none">{badge.day}</span>
        <span className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-foreground/55">
          {badge.weekday}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
          {host?.flagSrc ? (
            <Image
              alt=""
              className="h-3.5 w-5 rounded-[2px] border border-line object-cover"
              height={14}
              src={host.flagSrc}
              unoptimized
              width={20}
            />
          ) : null}
          <span>{host ? host.name : GLOBAL_HOST_LABEL}</span>
        </p>
        <h3 className="mt-2 text-xl font-semibold text-teal-deep">{event.title}</h3>
        <p className="mt-2 text-sm font-semibold text-foreground/70">
          <time dateTime={event.startAt}>{formatEventWhen(event, timeZone)}</time>
        </p>
        {event.location ? (
          <p className="mt-1 text-sm font-semibold text-foreground/58">{event.location}</p>
        ) : null}
        {event.description ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/72">
            {event.description}
          </p>
        ) : null}

        {event.linkUrl || host ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {event.linkUrl ? (
              <TrackedLink
                className="button-link primary"
                event={{
                  name: "select_content",
                  params: { content_type: "event", content_id: event.title, outbound: true },
                }}
                href={event.linkUrl}
              >
                Event details ↗<span className="sr-only"> (opens in a new tab)</span>
              </TrackedLink>
            ) : null}
            {host ? (
              <TrackedLink
                className="button-link secondary"
                event={{
                  name: "select_content",
                  params: {
                    content_type: "affiliate_site",
                    content_id: host.name,
                    outbound: host.external,
                  },
                }}
                href={host.href}
                target={host.external ? "_blank" : "_self"}
                title={host.external ? `Opens ${host.host} in a new tab` : undefined}
              >
                Visit {host.name}
                {host.external ? (
                  <>
                    {" ↗"}
                    <span className="sr-only"> (opens {host.host} in a new tab)</span>
                  </>
                ) : null}
              </TrackedLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
