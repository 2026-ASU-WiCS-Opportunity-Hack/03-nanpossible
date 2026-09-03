import Link from "next/link";
import {
  visibleFooterLinks,
  type GlobalFooterContent,
} from "@/lib/global-footer";
import type { SiteContext } from "@/lib/types";

type SiteFooterContentProps = {
  content: GlobalFooterContent;
  siteContext: SiteContext;
};

export function SiteFooterContent({
  content,
  siteContext,
}: SiteFooterContentProps) {
  const siteName = siteContext.isGlobal ? "WIAL" : siteContext.tenant.name;
  const email = (siteContext.tenant?.contactEmail ?? content.email).trim();

  const eyebrow = content.eyebrow.trim();
  const heading = content.heading.trim();
  const description = content.description.trim();
  const hasBrand = Boolean(eyebrow || heading || description);

  const contactHeading = content.contactHeading.trim();
  const address = content.address.trim();
  const hasContact = Boolean(contactHeading || address || email);

  const linksHeading = content.linksHeading.trim();
  const links = visibleFooterLinks(content.links);
  const hasLinks = Boolean(linksHeading || links.length > 0);

  const leftLegal = content.leftLegal.trim();
  const rightLegal = content.rightLegal.trim();
  const hasLegal = Boolean(leftLegal || rightLegal);

  const hasTopRow = hasBrand || hasContact;

  if (!hasTopRow && !hasLinks && !hasLegal) {
    return null;
  }

  return (
    <div className="site-panel rounded-[2rem] px-6 py-6 md:px-8">
      {hasTopRow && (
        <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
          {hasBrand && (
            <div className="space-y-3">
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              {heading && (
                <h2 className="max-w-xl font-display text-3xl leading-none tracking-[-0.04em] text-teal-deep">
                  {heading}
                </h2>
              )}
              {description && (
                <p className="max-w-xl text-base leading-7 text-foreground/78">
                  {description}
                </p>
              )}
            </div>
          )}

          {hasContact && (
            <div className="space-y-2">
              {contactHeading && (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
                  {contactHeading}
                </p>
              )}
              {address && (
                <p className="whitespace-pre-line text-sm leading-7 text-foreground/78">
                  {address}
                </p>
              )}
              {email && (
                <Link
                  className="font-semibold text-accent"
                  href={`mailto:${email}`}
                >
                  {email}
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {hasLinks && (
        <div
          className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 ${hasTopRow ? "mt-6" : ""}`}
        >
          {linksHeading && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
              {linksHeading}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {links.map((link) => (
              <Link
                className="text-sm font-semibold text-teal-deep"
                href={link.href}
                key={link.id}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(hasTopRow || hasLinks) && hasLegal && (
        <div className="shell-divider my-5" />
      )}

      {hasLegal && (
        <div className="flex flex-col gap-3 text-sm text-foreground/62 md:flex-row md:items-center md:justify-between">
          {leftLegal && <p>{leftLegal.replaceAll("{siteName}", siteName)}</p>}
          {rightLegal && <p>{rightLegal}</p>}
        </div>
      )}
    </div>
  );
}
