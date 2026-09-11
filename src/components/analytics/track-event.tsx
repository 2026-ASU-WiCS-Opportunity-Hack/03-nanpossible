"use client";

import { useEffect } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

type TrackEventProps = {
  event: AnalyticsEvent;
  /**
   * When set, the event fires at most once per browser session for this key
   * (e.g. `purchase:<session id>` so a reload of the receipt page does not
   * double count).
   */
  dedupeKey?: string;
};

/**
 * Fires an analytics event once when a server-rendered outcome mounts —
 * receipt pages, "your message was sent" notices, error banners. Renders nothing.
 */
export function TrackEvent({ event, dedupeKey }: TrackEventProps) {
  const serialized = JSON.stringify(event);

  useEffect(() => {
    if (dedupeKey) {
      const storageKey = `wial-ga:${dedupeKey}`;
      try {
        if (window.sessionStorage.getItem(storageKey)) {
          return;
        }
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // Storage unavailable (private mode, blocked) — still send the event.
      }
    }
    trackEvent(JSON.parse(serialized) as AnalyticsEvent);
  }, [dedupeKey, serialized]);

  return null;
}
