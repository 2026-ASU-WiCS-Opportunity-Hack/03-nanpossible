import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterHero } from "@/components/chapter/ChapterHero";
import { FeaturedCoaches } from "@/components/chapter/FeaturedCoaches";
import { UpcomingEvents } from "@/components/chapter/UpcomingEvents";
import { getContentPage } from "@/lib/content";
import { listUpcomingEvents } from "@/lib/events";
import { listApprovedCoaches } from "@/lib/coaches";
import { getChapterBySubdomain } from "@/lib/tenant";

type TenantHomePageProps = {
  params: Promise<{
    tenant: string;
  }>;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function websiteHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const { tenant } = await params;
  const chapter = await getChapterBySubdomain(tenant);

  if (!chapter) {
    notFound();
  }

  const [aboutPage, testimonialsPage, coaches, events] = await Promise.all([
    getContentPage({
      slug: "about",
      chapterId: chapter.id,
      tenantSubdomain: chapter.subdomain,
    }),
    getContentPage({
      slug: "testimonials",
      chapterId: chapter.id,
      tenantSubdomain: chapter.subdomain,
    }),
    listApprovedCoaches({ chapterId: chapter.id, limit: 4 }),
    chapter.websiteUrl
      ? Promise.resolve([])
      : listUpcomingEvents(chapter.id, {
          limit: 3,
          tenantSubdomain: chapter.subdomain,
        }),
  ]);

  const aboutPreview = aboutPage?.bodyHtml ? stripHtml(aboutPage.bodyHtml).slice(0, 220) : "";
  return (
    <div className="page-frame">
      <div className="site-shell">
        <div className="grid gap-6">
            {chapter.websiteUrl ? (
              <section className="site-panel flex flex-wrap items-center justify-between gap-3 rounded-[2rem] px-6 py-4">
                <p className="text-base leading-7 text-foreground/80">
                  {chapter.name}&rsquo;s official website is{" "}
                  <span className="font-semibold text-teal-deep">
                    {websiteHost(chapter.websiteUrl)}
                  </span>
                  .
                </p>
                <a
                  className="button-link primary"
                  href={chapter.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit the official website
                </a>
              </section>
            ) : null}

            <ChapterHero chapter={chapter} />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
              <section className="site-panel rounded-[2rem] p-6 md:p-8">
                <p className="eyebrow">About this affiliate</p>
                <h2 className="mt-3 font-display text-3xl text-teal-deep">Regional focus</h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-foreground/76">
                  {aboutPreview ||
                    chapter.description ||
                    "This affiliate is preparing its local story, leadership focus, and community programming details."}
                </p>
                {!chapter.websiteUrl ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link className="button-link secondary" href="/about">
                      Read about the affiliate
                    </Link>
                    <Link className="button-link secondary" href="/contact">
                      Contact this affiliate
                    </Link>
                  </div>
                ) : null}
              </section>

              <section className="site-panel rounded-[2rem] p-6">
                <p className="eyebrow">Affiliate contact</p>
                <div className="mt-5 space-y-3 text-base leading-7 text-foreground/75">
                  {chapter.contactEmail ? <p>{chapter.contactEmail}</p> : null}
                  {chapter.contactPhone ? <p>{chapter.contactPhone}</p> : null}
                  {chapter.country ? <p>{chapter.country}</p> : null}
                </div>
              </section>
            </div>

            <FeaturedCoaches coaches={coaches} />
            {!chapter.websiteUrl ? <UpcomingEvents events={events} /> : null}

            {testimonialsPage?.bodyHtml ? (
              <section className="site-panel rounded-[2rem] p-6 md:p-8">
                <p className="eyebrow">Testimonials</p>
                <div
                  className="prose mt-5 max-w-none"
                  dangerouslySetInnerHTML={{ __html: testimonialsPage.bodyHtml }}
                />
              </section>
            ) : null}
        </div>
      </div>
    </div>
  );
}
