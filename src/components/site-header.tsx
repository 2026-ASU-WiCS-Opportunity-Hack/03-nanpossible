import Link from "next/link";
import { AccessibilityPreferencesWidget } from "@/components/accessibility-preferences";
import { MobileNav } from "@/components/mobile-nav";
import { WialLogo } from "@/components/wial-logo";
import { getAccountNavItems } from "@/lib/account";
import { isExternalHref, navigationItems } from "@/lib/routing";
import type { SiteContext, UserProfile } from "@/lib/types";

const navLinkClassName =
  "whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium text-teal-deep transition hover:bg-accent-soft lg:px-2.5";

type SiteHeaderProps = {
  siteContext: SiteContext;
  viewer: UserProfile | null;
};

export function SiteHeader({ siteContext, viewer }: SiteHeaderProps) {
  const chapterLabel = siteContext.tenant?.name ?? null;

  const voiceNavigationRoutes = [
    { href: "/", label: "Home" },
    ...navigationItems,
    ...(viewer ? getAccountNavItems(viewer.role) : []),
    ...(!viewer
      ? [
          { href: "/login", label: "Sign in" },
          { href: "/register", label: "Register" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-[var(--background)]/85 py-3 backdrop-blur-xl">
      <div className="site-shell">
        <div className="site-panel flex items-center gap-3 px-4 py-3 sm:px-5 lg:gap-5 lg:px-6">
          <div className="min-w-0 flex-1">
            <WialLogo chapterLabel={chapterLabel} />
          </div>

          <nav className="hidden flex-1 items-center justify-end gap-0 lg:flex">
            {navigationItems.map((item) =>
              isExternalHref(item.href) ? (
                <a
                  className={navLinkClassName}
                  href={item.href}
                  key={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.label}
                </a>
              ) : (
                <Link className={navLinkClassName} href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {viewer ? (
              <form
                action="/auth/sign-out"
                method="post"
                className="hidden sm:block"
              >
                <button
                  type="submit"
                  className="button-link secondary px-4 py-2.5 text-sm"
                >
                  Logout
                </button>
              </form>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden whitespace-nowrap text-sm font-semibold text-teal-deep/78 transition hover:text-teal-deep sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="button-link primary hidden px-4 py-2.5 text-sm sm:inline-flex"
                >
                  Register
                </Link>
              </>
            )}
            <AccessibilityPreferencesWidget
              navigationRoutes={voiceNavigationRoutes}
              variant="desktop"
            />
            <div className="flex items-center gap-2 lg:hidden">
              <AccessibilityPreferencesWidget
                navigationRoutes={voiceNavigationRoutes}
                variant="mobile"
              />
              <MobileNav
                chapterLabel={chapterLabel}
                items={navigationItems}
                viewer={viewer}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}