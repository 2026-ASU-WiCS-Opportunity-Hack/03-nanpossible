import Script from "next/script";
import { AnalyticsSession } from "@/components/analytics/analytics-session";
import {
  analyticsSiteTenant,
  getAnalyticsBootScript,
  gtagScriptSrc,
  type AnalyticsConfig,
} from "@/lib/analytics";
import type { SiteContext, UserProfile } from "@/lib/types";

type GoogleAnalyticsProps = {
  config: AnalyticsConfig;
  siteContext: SiteContext;
  viewer: UserProfile | null;
};

/**
 * Google Analytics 4 bootstrap for the root layout. The inline stub runs in
 * `<head>` before hydration so `window.gtag` is always defined when client
 * code calls `trackEvent`; gtag.js itself loads after hydration.
 */
export function GoogleAnalytics({ config, siteContext, viewer }: GoogleAnalyticsProps) {
  if (!config.enabled) {
    return null;
  }

  const user = {
    siteTenant: analyticsSiteTenant(siteContext),
    userRole: viewer?.role ?? null,
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: getAnalyticsBootScript(config, user) }}
        id="wial-ga-boot"
      />
      <Script src={gtagScriptSrc(config.measurementId)} strategy="afterInteractive" />
      <AnalyticsSession siteTenant={user.siteTenant} userRole={user.userRole} />
    </>
  );
}
