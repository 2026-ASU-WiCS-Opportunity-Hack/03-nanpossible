import Link from "next/link";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import { listGlobalPagesForAdmin } from "@/lib/content";

export default async function GlobalPagesAdminPage() {
  await requireAccountViewer("/admin/global/pages", ["platform_admin"]);
  const pages = await listGlobalPagesForAdmin();

  return (
    <AccountPageShell
      badge="Site pages"
      description="Edit the content of the public site pages — headings, text, timelines, and calls to action."
      eyebrow="Global admin"
      title="Site pages"
    >
      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="grid gap-3">
          {pages.map((page) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-line/60 bg-white/55 px-4 py-3"
              key={page.id}
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{page.title}</p>
                <p className="text-sm text-foreground/60">
                  {page.slug === "home" ? "/" : `/${page.slug}`}
                  {page.published ? "" : " · hidden"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  className="button-link ghost"
                  href={page.slug === "home" ? "/" : `/${page.slug}`}
                  target="_blank"
                >
                  View
                </Link>
                <Link
                  className="button-link secondary"
                  href={`/admin/global/pages/${page.slug}`}
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {pages.length === 0 ? (
            <p className="rounded-[1.25rem] border border-line/60 bg-white/55 px-4 py-6 text-center text-sm text-foreground/60">
              No pages found.
            </p>
          ) : null}
        </div>
      </section>
    </AccountPageShell>
  );
}
