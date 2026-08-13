import Link from "next/link";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import {
  formatCoachLocation,
  getCertificationBadgeTone,
  listCoachesForAdmin,
} from "@/lib/coaches";

const PAGE_SIZE = 25;

type GlobalCoachesPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    notice?: string;
  }>;
};

function getNotice(notice?: string) {
  switch (notice) {
    case "saved":
      return "Coach details saved.";
    default:
      return null;
  }
}

export default async function GlobalCoachesPage({
  searchParams,
}: GlobalCoachesPageProps) {
  await requireAccountViewer("/admin/global/coaches", ["platform_admin"]);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const { coaches, total } = await listCoachesForAdmin({
    query,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    if (query) {
      next.set("q", query);
    }
    if (target > 1) {
      next.set("page", String(target));
    }
    const suffix = next.toString();
    return suffix ? `/admin/global/coaches?${suffix}` : "/admin/global/coaches";
  };

  return (
    <AccountPageShell
      badge="Coach roster"
      description="Search the full coach roster and edit any coach's public profile details."
      eyebrow="Global admin"
      title="Coaches"
    >
      {getNotice(params.notice) ? (
        <div className="account-flash is-success">{getNotice(params.notice)}</div>
      ) : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <form action="/admin/global/coaches" className="flex flex-wrap items-end gap-3" method="get">
          <label className="field-shell min-w-[260px] flex-1">
            <span className="field-label">Search by name</span>
            <input
              className="field-input"
              defaultValue={query}
              name="q"
              placeholder="e.g. Bea Carson"
              type="search"
            />
          </label>
          <button className="button-link primary" type="submit">
            Search
          </button>
        </form>

        <p className="mt-4 text-sm text-foreground/65">
          {total} {total === 1 ? "coach" : "coaches"}
          {query ? ` matching “${query}”` : ""}
        </p>

        <div className="mt-4 grid gap-3">
          {coaches.map((coach) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-line/60 bg-white/55 px-4 py-3"
              key={coach.id}
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{coach.name}</p>
                <p className="text-sm text-foreground/60">
                  {[formatCoachLocation(coach), coach.organization]
                    .filter(Boolean)
                    .join(" · ") || "No location published"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${getCertificationBadgeTone(coach.certLevel)}`}
                >
                  {coach.certLevel ?? "Pending"}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">
                  {coach.approved ? "Approved" : "Not approved"}
                </span>
                {coach.approved ? (
                  <Link
                    className="button-link ghost"
                    href={`/coaches/${encodeURIComponent(coach.slug ?? coach.id)}`}
                  >
                    View
                  </Link>
                ) : null}
                <Link
                  className="button-link secondary"
                  href={`/admin/global/coaches/${coach.id}`}
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {coaches.length === 0 ? (
            <p className="rounded-[1.25rem] border border-line/60 bg-white/55 px-4 py-6 text-center text-sm text-foreground/60">
              No coaches match this search.
            </p>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="mt-5 flex items-center justify-between">
            {page > 1 ? (
              <Link className="button-link secondary" href={pageHref(page - 1)}>
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-foreground/60">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link className="button-link secondary" href={pageHref(page + 1)}>
                Next
              </Link>
            ) : (
              <span />
            )}
          </div>
        ) : null}
      </section>
    </AccountPageShell>
  );
}
