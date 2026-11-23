"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { isOutboundHref, trackEvent, type AnalyticsEvent } from "@/lib/analytics";

type TrackedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  event: AnalyticsEvent;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * A link that reports a click before navigating. Internal paths render a
 * Next `Link`; absolute URLs render a new-tab anchor; `mailto:`/`tel:` render
 * a plain anchor. Safe to use from server components — `event` is plain data.
 */
export function TrackedLink({ href, event, children, onClick, ...rest }: TrackedLinkProps) {
  const handleClick = (mouseEvent: MouseEvent<HTMLAnchorElement>) => {
    trackEvent(event);
    onClick?.(mouseEvent);
  };

  if (isOutboundHref(href)) {
    // Pass `target="_self"` for an absolute URL that is still our own site
    // (a hosted affiliate subdomain): it then opens in place and keeps the referrer.
    const { target = "_blank", rel = target === "_blank" ? "noreferrer" : undefined, ...anchorRest } =
      rest;
    return (
      <a href={href} onClick={handleClick} rel={rel} target={target} {...anchorRest}>
        {children}
      </a>
    );
  }

  if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
