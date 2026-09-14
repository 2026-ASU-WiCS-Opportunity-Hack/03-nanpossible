import Link from "next/link";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { certificationInHouse } from "@/content/certification-hub";

/**
 * /certification/in-house-programs — the in-house programs copy that used to
 * be a section of the certification hub (#143 gave it its own SEO-friendly
 * page). Content comes from certification-hub.ts like the rest of the hub.
 */
export function InHouseProgramsPage() {
  const content = certificationInHouse;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-8">
        <nav aria-label="Breadcrumb" className="text-sm text-foreground/60">
          <Link
            href={content.backHref}
            className="font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4"
          >
            ← {content.backLabel}
          </Link>
        </nav>

        <div className="rounded-lg bg-gradient-to-r from-teal-deep/5 to-gold/5 p-6">
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="mt-3 text-2xl font-bold">{content.pageTitle}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/70">
            {content.intro[0]}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.image.src}
            alt={content.image.alt}
            className="mt-5 w-full rounded-lg object-cover"
          />
        </div>

        <section aria-labelledby="in-house-highlights">
          <h2 id="in-house-highlights" className="text-2xl font-bold">
            How an in-house program works
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {content.highlights.map((item) => (
              <article className="site-panel rounded-lg px-6 py-5" key={item.title}>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="in-house-detail">
          <h2 id="in-house-detail" className="text-2xl font-bold">
            Built for your organization
          </h2>
          <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-foreground/70">
            {content.intro.slice(1).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <blockquote className="quote-block mt-4 rounded-lg">
            <p>&quot;{content.quote.quote}&quot;</p>
            <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-[0.16em] text-teal">
              {content.quote.attribution}
            </span>
          </blockquote>
        </section>

        <section className="site-panel rounded-lg px-6 py-5">
          <h2 className="text-sm font-semibold">{content.foundationsNote}</h2>
          <Link
            href={content.foundationsHref}
            className="mt-2 inline-block text-sm font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4"
          >
            {content.foundationsLabel}
          </Link>
        </section>

        <div className="site-panel rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold">Bring certification to your team</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Tell us about your organization and objectives, and we will propose a program
            configuration and coaching team.
          </p>
          <TrackedLink
            className="button-link primary mt-4"
            event={{
              name: "cta_click",
              params: {
                cta_label: content.contactLabel,
                cta_location: "certification",
                cta_destination: content.contactHref,
              },
            }}
            href={content.contactHref}
          >
            {content.contactLabel}
          </TrackedLink>
        </div>
      </div>
    </main>
  );
}
