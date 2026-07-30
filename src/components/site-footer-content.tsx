import Link from "next/link";
import type { GlobalFooterContent } from "@/lib/global-footer";
import type { SiteContext } from "@/lib/types";

type SiteFooterContentProps = {
  content: GlobalFooterContent;
  siteContext: SiteContext;
};

export function SiteFooterContent({
  content,
  siteContext,
}: SiteFooterContentProps) {
  const siteName = siteContext.isGlobal
    ? "Global WIAL site shell"
    : `${siteContext.tenant.name} affiliate shell`;
  const email = siteContext.tenant?.contactEmail ?? content.email;

  return (
    <div className="site-panel rounded-[2rem] px-6 py-8 md:px-8">
      <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 className="max-w-xl font-display text-3xl leading-none tracking-[-0.04em] text-teal-deep">
            {content.heading}
          </h2>
          <p className="max-w-xl text-base leading-7 text-foreground/78">
            {content.description}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
            {content.contactHeading}
          </p>
          <p className="whitespace-pre-line text-sm leading-7 text-foreground/78">
            {content.address}
          </p>
          <Link className="font-semibold text-accent" href={`mailto:${email}`}>
            {email}
          </Link>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
            {content.linksHeading}
          </p>
          <div className="flex flex-col gap-2 text-sm font-semibold text-teal-deep">
            {content.links.map((link) => (
              <Link href={link.href} key={link.id}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="shell-divider my-7" />

      <div className="flex flex-col gap-3 text-sm text-foreground/62 md:flex-row md:items-center md:justify-between">
        <p>{content.leftLegal.replaceAll("{siteName}", siteName)}</p>
        <p>{content.rightLegal}</p>
      </div>
    </div>
  );
}
