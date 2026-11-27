import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import { getConferenceForAdmin } from "@/lib/conferences";
import { conferencePageSlug } from "@/lib/conferences-fields";
import { getClientTestimonials, getGlobalPageBySlugForAdmin } from "@/lib/content";
import { PageContentEditor } from "../../pages/[slug]/PageContentEditor";
import { deleteConferenceAction, updateConferenceDetailsAction } from "../actions";
import { conferenceError, conferenceNotice } from "../messages";

type ConferenceEditPageProps = {
  params: Promise<{ conferenceId: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function ConferenceEditPage({ params, searchParams }: ConferenceEditPageProps) {
  const { conferenceId } = await params;
  await requireAccountViewer(`/admin/global/conferences/${conferenceId}`, ["platform_admin"]);

  const [query, conference] = await Promise.all([searchParams, getConferenceForAdmin(conferenceId)]);
  if (!conference) {
    notFound();
  }

  const pageSlug = conferencePageSlug(conference.slug);
  const [page, testimonials] = await Promise.all([
    getGlobalPageBySlugForAdmin(pageSlug),
    getClientTestimonials(),
  ]);
  if (!page) {
    notFound();
  }

  const notice = conferenceNotice(query.notice);
  const errorMessage = conferenceError(query.error);

  return (
    <AccountPageShell
      badge="Conferences"
      description="Set when and where the conference is, then write its page. Page changes go live as soon as you save them."
      eyebrow="Global admin"
      title={`Edit: ${conference.title}`}
    >
      {notice ? <div className="account-flash is-success">{notice}</div> : null}
      {errorMessage ? <div className="account-flash is-error">{errorMessage}</div> : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Conference details</p>
            <p className="text-base leading-7 text-foreground/75">
              Dates and location appear on the conference page and on the Conferences listing.
            </p>
          </div>
          <Link className="button-link ghost" href="/admin/global/conferences">
            All conferences
          </Link>
        </div>

        <form action={updateConferenceDetailsAction} className="mt-5 grid gap-4">
          <input name="id" type="hidden" value={conference.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-shell">
              <span className="field-label">First day</span>
              <input
                className="field-input"
                defaultValue={conference.startDate ?? ""}
                name="startDate"
                type="date"
              />
            </label>
            <label className="field-shell">
              <span className="field-label">Last day</span>
              <input
                className="field-input"
                defaultValue={conference.endDate ?? ""}
                name="endDate"
                type="date"
              />
            </label>
          </div>
          <label className="field-shell">
            <span className="field-label">City and country</span>
            <input
              className="field-input"
              defaultValue={conference.location ?? ""}
              name="location"
              placeholder="Tokyo, Japan"
              type="text"
            />
          </label>
          <label className="field-shell">
            <span className="field-label">Web address</span>
            <input
              className="field-input"
              defaultValue={conference.slug}
              name="slug"
              required
              type="text"
            />
            <span className="mt-1.5 block text-sm text-foreground/60">
              The page lives at /conferences/{conference.slug}. Changing this breaks links people
              have already shared.
            </span>
          </label>
          <label className="coach-checkbox">
            <input defaultChecked={conference.archived} name="archived" type="checkbox" />
            <span>This conference is over — list it in the archive</span>
          </label>
          <div>
            <button className="button-link primary" type="submit">
              Save details
            </button>
          </div>
        </form>
      </section>

      <PageContentEditor
        initialBody={page.bodyRichtext}
        initialPublished={page.published}
        initialTitle={page.title}
        key={pageSlug}
        slug={pageSlug}
        testimonials={testimonials}
      />

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <p className="eyebrow">Delete this conference</p>
        <p className="mt-2 text-base leading-7 text-foreground/75">
          Deleting removes the conference and its page for good. To keep the page online as a
          record, move the conference to the archive instead.
        </p>
        <form action={deleteConferenceAction} className="mt-4 grid gap-4">
          <input name="id" type="hidden" value={conference.id} />
          <label className="coach-checkbox">
            <input name="confirm" type="checkbox" />
            <span>Yes, permanently delete “{conference.title}”</span>
          </label>
          <div>
            <button className="button-link ghost" type="submit">
              Delete conference
            </button>
          </div>
        </form>
      </section>
    </AccountPageShell>
  );
}
