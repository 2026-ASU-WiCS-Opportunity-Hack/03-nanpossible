"use client";

import { useEffect, useRef } from "react";
import { setAnalyticsUser, trackEvent } from "@/lib/analytics";
import type { AppRole } from "@/lib/types";

type AnalyticsSessionProps = {
  siteTenant: string;
  userRole: AppRole | null;
};

/**
 * Keeps the `user_role` / `site_tenant` dimensions current across soft
 * navigations (server actions re-render the root layout with the new viewer)
 * and records `login` when an anonymous session becomes a signed-in one.
 * The initial values ride along in the boot script, so mount is a no-op.
 */
export function AnalyticsSession({ siteTenant, userRole }: AnalyticsSessionProps) {
  const previousRole = useRef<AppRole | null | undefined>(undefined);

  useEffect(() => {
    const previous = previousRole.current;
    previousRole.current = userRole;

    if (previous === undefined || previous === userRole) {
      return;
    }

    setAnalyticsUser({ siteTenant, userRole });

    if (previous === null && userRole) {
      trackEvent({ name: "login", params: { method: "password" } });
    } else if (previous && userRole === null) {
      trackEvent({ name: "logout", params: {} });
    }
  }, [siteTenant, userRole]);

  return null;
}
