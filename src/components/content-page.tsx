import Link from "next/link";
import type { ReactNode } from "react";
import { PartnerPricing } from "@/components/partner-pricing";
import type { ContentPageRecord, ContentSection, SiteContext } from "@/lib/types";

type ContentPageProps = {
  page: ContentPageRecord;
  siteContext: SiteContext;
  /** Rendered after the content sections — for route-specific UI such as forms. */
  children?: ReactNode;
};

export function renderSection(section: ContentSection) {
  switch (section.type) {
    case "prose":
      return (
        <section className="section-stack" key={section.title}>
          <div className="space-y-4">
            <h2 className="section-title text-teal-deep">{section.title}</h2>
            <div className="section-copy">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets?.length ? (
                <ul className="section-list list-disc">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      );
    case "feature_grid":
      return (
        <section className="section-stack" key={section.title}>
          <h2 className="section-title text-teal-deep">{section.title}</h2>
          <div className="feature-grid">
            {section.items.map((item) => (
              <article className="feature-card flex flex-col rounded-[1.5rem]" key={item.title}>
                {item.image ? (
                  <div className="mb-4 overflow-hidden rounded-[1rem] border border-line bg-white/70">
                    <img
                      alt={item.imageAlt ?? ""}
                      className="h-48 w-full object-contain p-3"
                      loading="lazy"
                      src={item.image}
                    />
                  </div>
                ) : null}
                {item.eyebrow ? (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-green">
                    {item.eyebrow}
                  </p>
                ) : null}
                <h3>{item.title}</h3>
                <p className="mt-3">{item.body}</p>
                {item.href && item.label ? (
                  /^(https?:|mailto:)/.test(item.href) ? (
                    <a
                      className="mt-auto inline-flex pt-5 font-semibold text-teal"
                      href={item.href}
                      rel="noreferrer"
                      target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link className="mt-auto inline-flex pt-5 font-semibold text-teal" href={item.href}>
                      {item.label}
                    </Link>
                  )
                ) : null}
              </article>
            ))}
          </div>
        </section>
      );
    case "timeline":
      return (
        <section className="section-stack" key={section.title}>
          <h2 className="section-title text-teal-deep">{section.title}</h2>
          <div className="grid gap-4">
            {section.items.map((item) => (
              <article
                className="feature-card rounded-[1.5rem] md:grid md:grid-cols-[120px_1fr] md:items-start md:gap-6"
                key={`${item.title}-${item.year ?? "present"}`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green">
                  {item.year ?? "Now"}
                </p>
                <div className="mt-3 space-y-2 md:mt-0">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    case "quote":
      return (
        <section className="quote-block rounded-[1.75rem]" key={section.attribution}>
          <p>&quot;{section.quote}&quot;</p>
          <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-[0.16em] text-teal">
            {section.attribution}
          </span>
        </section>
      );
    case "resource_list":
      return (
        <section className="section-stack" key={section.title}>
          <div className="space-y-4">
            <h2 className="section-title text-teal-deep">{section.title}</h2>
            <p className="max-w-3xl text-base leading-7 text-foreground/75">
              {section.description}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {section.items.map((item) => (
              <article className="feature-card rounded-[1.5rem]" key={item.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">
                  {item.kind}
                </p>
                <h3 className="mt-3">{item.title}</h3>
                <p className="mt-3">{item.body}</p>
                <Link
                  className="mt-5 inline-flex font-semibold text-teal"
                  href={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.label}
                </Link>
              </article>
            ))}
          </div>
        </section>
      );
    case "contact_cards":
      return (
        <section className="section-stack" key={section.title}>
          <h2 className="section-title text-teal-deep">{section.title}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {section.items.map((item) => (
              <article className="feature-card rounded-[1.5rem]" key={item.title}>
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      alt={item.imageAlt ?? ""}
                      className="h-6 w-8 rounded-[0.3rem] border border-line object-cover"
                      src={item.image}
                    />
                  ) : null}
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">
                    {item.eyebrow}
                  </p>
                </div>
                <h3 className="mt-3">{item.title}</h3>
                <p className="mt-3 whitespace-pre-line">{item.body}</p>
                {item.href && item.label ? (
                  <Link
                    className="mt-5 inline-flex font-semibold text-teal"
                    href={item.href}
                    {...(item.href.startsWith("http") ? { rel: "noreferrer", target: "_blank" } : {})}
                  >
                    {item.label}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      );
    case "pricing_tiers":
      return <PartnerPricing key={section.title} section={section} />;
    case "logo_grid":
      return (
        <section className="section-stack" key={section.title}>
          <h2 className="section-title text-teal-deep">{section.title}</h2>
          <div
            className={
              section.compact
                ? "grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6"
                : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }
          >
            {section.items.map((item) => {
              const tileClassName = section.compact
                ? "feature-card flex aspect-[3/2] items-center justify-center rounded-[1rem] p-4 transition-transform duration-200 hover:scale-[1.03]"
                : "feature-card flex aspect-[4/3] items-center justify-center rounded-[1.5rem] p-8 transition-transform duration-200 hover:scale-[1.03]";
              const logo = item.logo ? (
                <img
                  alt={`${item.name} logo`}
                  className="max-h-full max-w-full object-contain filter grayscale hover:grayscale-0 transition-all"
                  src={item.logo}
                />
              ) : (
                <span className="logo-grid-name">{item.name}</span>
              );

              return item.href ? (
                <a
                  className={tileClassName}
                  href={item.href}
                  key={item.name}
                  rel="noreferrer"
                  target="_blank"
                  title={`Visit ${item.name}`}
                >
                  {logo}
                </a>
              ) : (
                <article className={tileClassName} key={item.name}>
                  {logo}
                </article>
              );
            })}
          </div>
        </section>
      );
    case "media_prose":
      return (
        <section className="section-stack" key={section.title}>
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className={section.imagePosition === "right" ? "md:order-2" : ""}>
              <div className="overflow-hidden rounded-[2rem] border border-line shadow-shadow">
                <img
                  alt={section.imageAlt}
                  className="aspect-video w-full object-cover md:aspect-square"
                  src={section.image}
                />
              </div>
              {section.caption ? (
                <p className="mt-3 text-center text-sm italic text-foreground/60">
                  {section.caption}
                </p>
              ) : null}
            </div>
            <div className={`space-y-4 ${section.imagePosition === "right" ? "md:order-1" : ""}`}>
              <h2 className="section-title text-teal-deep">{section.title}</h2>
              <div className="section-copy">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul className="section-list list-disc">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      );
    case "gallery_grid":
      return (
        <section className="section-stack" key={section.title}>
          <div className="space-y-4">
            <h2 className="section-title text-teal-deep">{section.title}</h2>
            {section.description ? (
              <p className="max-w-3xl text-base leading-7 text-foreground/75">
                {section.description}
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, index) => (
              <article
                className="feature-card flex flex-col rounded-[1.5rem]"
                key={`${item.title}-${index}`}
              >
                {item.image ? (
                  <div className="flex h-56 items-center justify-center overflow-hidden rounded-[1rem] border border-line bg-white p-3">
                    <img
                      alt={item.imageAlt ?? item.title}
                      className="max-h-full max-w-full object-contain"
                      src={item.image}
                    />
                  </div>
                ) : null}
                <h3 className="mt-4">{item.title}</h3>
                {item.subtitle ? (
                  <p className="mt-1 text-sm text-foreground/70">{item.subtitle}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      );
    case "testimonial_grid":
      return (
        <section className="section-stack" key={section.title}>
          <div className="space-y-4">
            <h2 className="section-title text-teal-deep">{section.title}</h2>
            {section.description ? (
              <p className="max-w-3xl text-base leading-7 text-foreground/75">
                {section.description}
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {section.items.map((item, index) => (
              <article
                className="feature-card flex flex-col gap-4 rounded-[1.5rem]"
                key={`${item.organization}-${index}`}
              >
                {item.videoUrl ? (
                  <div className="overflow-hidden rounded-[1rem] border border-line">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="aspect-video w-full"
                      loading="lazy"
                      src={item.videoUrl}
                      title={item.videoTitle ?? `${item.organization} video testimonial`}
                    />
                  </div>
                ) : null}
                {item.context ? (
                  <p className="text-sm text-foreground/70">{item.context}</p>
                ) : null}
                {item.quote ? (
                  <blockquote className="text-base leading-7 text-foreground/85">
                    “{item.quote}”
                  </blockquote>
                ) : null}
                <footer className="mt-auto flex items-center gap-3">
                  {item.logo ? (
                    <img
                      alt={`${item.organization} logo`}
                      className="h-8 w-auto max-w-[7rem] shrink-0 object-contain"
                      src={item.logo}
                    />
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-foreground/60">
                      {item.role ? `${item.role}, ` : ""}
                      {item.organization}
                    </p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </section>
      );
    case "people_grid":
      return (
        <section className="section-stack" key={section.title}>
          <div className="space-y-4">
            <h2 className="section-title text-teal-deep">{section.title}</h2>
            {section.description ? (
              <p className="max-w-3xl text-base leading-7 text-foreground/75">
                {section.description}
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((person) => (
              <article className="feature-card rounded-[1.5rem]" key={person.name}>
                {person.image ? (
                  <img
                    alt={person.imageAlt ?? `Portrait of ${person.name}`}
                    className="h-24 w-24 rounded-full border border-line object-cover"
                    src={person.image}
                  />
                ) : null}
                {person.eyebrow ? (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-green">
                    {person.eyebrow}
                  </p>
                ) : null}
                <h3 className={person.eyebrow ? "mt-2" : "mt-4"}>{person.name}</h3>
                <p className="mt-1 text-sm text-foreground/70">{person.role}</p>
              </article>
            ))}
          </div>
        </section>
      );
    case "cta":
      return (
        <section
          className="rounded-[1.9rem] border border-line bg-[linear-gradient(135deg,rgba(209,0,52,0.05),rgba(138,143,0,0.04))] p-6 md:p-8"
          key={section.title}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="eyebrow">Next step</span>
              <h2 className="section-title text-teal-deep">{section.title}</h2>
              <p className="text-base leading-7 text-foreground/78">{section.body}</p>
            </div>
            <Link className="button-link primary" href={section.href}>
              {section.label}
            </Link>
          </div>
        </section>
      );
  }
}

export function ContentPage({ page, siteContext, children }: ContentPageProps) {
  const body = page.bodyRichtext;

  return (
    <div className="page-frame">
      <div className="site-shell">
        <div className="hero-grid">
          <section className="site-panel hero-panel-warm rounded-[2rem] p-7 md:p-10">
            <div className="space-y-5">
              <span className="eyebrow">
                {siteContext.isGlobal ? "Global WIAL" : `${siteContext.tenant?.name} affiliate`}
              </span>
              <div className="space-y-4">
                <h1 className="max-w-4xl font-display text-3xl leading-none tracking-[-0.05em] text-teal-deep md:text-5xl">
                  {page.title}
                </h1>
                {body.heroIntro ? (
                  <p className="max-w-3xl whitespace-pre-line text-lg leading-8 text-foreground/82">
                    {body.heroIntro}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {page.slug !== "contact" ? (
                  <Link className="button-link primary" href="/contact">
                    Contact WIAL
                  </Link>
                ) : null}
                {page.slug !== "clients" ? (
                  <Link className="button-link secondary" href="/clients">
                    View our clients
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="site-panel rounded-[2rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/55">
              At a glance
            </p>
            <div className="mt-4 grid gap-3">
              {body.metrics.map((metric) => (
                <article className="metric-card rounded-[1.35rem]" key={metric.label}>
                  <p className="metric-value text-teal-deep">{metric.value}</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/60">
                    {metric.label}
                  </p>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-5">
          {body.sections.map((section) => renderSection(section))}
          {children}
        </div>
      </div>
    </div>
  );
}
