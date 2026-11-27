import Link from "next/link";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import { listConferencesForAdmin } from "@/lib/conferences";
import {
  formatConferenceDates,
  splitConferences,
  type ConferenceRecord,
} from "@/lib/conferences-fields";
import { createConferenceAction, setConferenceArchivedAction } from "./actions";
import { conferenceError, conferenceNotice } from "./messages";

type ConferencesAdminPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

function ConferenceRow({ conference }: { conference: ConferenceRecord }) {
  const facts = [formatConferenceDates(conference) ?? "Dates not set", conference.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-line/60 bg-white/55 px-4 py-3">
      <div className="min-w-0">
        <p className="font-semibold text-foreground">
          {conference.title}
          {conference.published ? null : (
            <span className="ml-2 rounded-full border border-[rgba(181,163,0,0.2)] bg-[rgba(181,163,0,0.1)] px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#6f5e00]">
              Draft
            </span>
          )}
        </p>
        <p className="text-sm text-foreground/60">{facts}</p>
        <p className="text-sm text-foreground/50">{conference.path}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {conference.published ? (
          <Link className="button-link ghost" href={conference.path} target="_blank">
            View
          </Link>
        ) : null}
        <form action={setConferenceArchivedAction}>
          <input name="id" type="hidden" value={conference.id} />
          <input name="path" type="hidden" value={conference.path} />
          <input name="archived" type="hidden" value={conference.archived ? "false" : "true"} />
          <button className="button-link ghost" type="submit">
            {conference.archived ? "Move back to upcoming" : "Move to archive"}
          </button>
        </form>
        <Link className="button-link secondary" href={`/admin/global/conferences/${conference.id}`}>
          Edit
        </Link>
      </div>
    </li>
  );
}

function ConferenceList({
  conferences,
  empty,
}: {
  conferences: ConferenceRecord[];
  empty: string;
}) {
  return conferences.length ? (
    <ul className="mt-5 grid gap-3">
      {conferences.map((conference) => (
        <ConferenceRow conference={conference} key={conference.id} />
      ))}
    </ul>
  ) : (
    <p className="mt-5 rounded-[1.25rem] border border-dashed border-line/75 bg-white/38 px-4 py-5 text-sm leading-7 text-foreground/64">
      {empty}
    </p>
  );
}

export default async function ConferencesAdminPage({ searchParams }: ConferencesAdminPageProps) {
  await requireAccountViewer("/admin/global/conferences", ["platform_admin"]);
  const [query, conferences] = await Promise.all([searchParams, listConferencesForAdmin()]);
  const notice = conferenceNotice(query.notice);
  const errorMessage = conferenceError(query.error);
  const { upcoming, archive } = splitConferences(conferences);
  const copyOptions = [...upcoming, ...archive];

  return (
    <AccountPageShell
      badge="Conferences"
      description="Each conference has its own page. Keep the next one under Upcoming, and move it to the archive once it is over."
      eyebrow="Global admin"
      title="Conferences"
    >
      {notice ? <div className="account-flash is-success">{notice}</div> : null}
      {errorMessage ? <div className="account-flash is-error">{errorMessage}</div> : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Upcoming</p>
            <p className="text-base leading-7 text-foreground/75">
              Featured at the top of the public Conferences page. Drafts stay hidden until you
              publish them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="button-link ghost" href="/admin/global/pages/conferences">
              Edit the Conferences page intro
            </Link>
            <Link className="button-link secondary" href="/conferences" target="_blank">
              View the public page
            </Link>
          </div>
        </div>
        <ConferenceList
          conferences={upcoming}
          empty="No upcoming conference yet. Start the next one below."
        />
      </section>

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <p className="eyebrow">Archive</p>
        <p className="mt-2 text-base leading-7 text-foreground/75">
          Past conferences. Their pages stay online and are listed under “Conference archive”.
        </p>
        <ConferenceList
          conferences={archive}
          empty="Nothing in the archive yet. Use “Move to archive” on a conference once it is over."
        />
      </section>

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <p className="eyebrow">Start a new conference</p>
        <p className="mt-2 text-base leading-7 text-foreground/75">
          This creates a hidden draft page. You can fill in dates and location later.
        </p>
        <form action={createConferenceAction} className="mt-5 grid gap-4">
          <label className="field-shell">
            <span className="field-label">Conference name</span>
            <input
              className="field-input"
              name="title"
              placeholder="WIAL Global Conference 2027"
              required
              type="text"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-shell">
              <span className="field-label">First day (optional)</span>
              <input className="field-input" name="startDate" type="date" />
            </label>
            <label className="field-shell">
              <span className="field-label">Last day (optional)</span>
              <input className="field-input" name="endDate" type="date" />
            </label>
          </div>
          <label className="field-shell">
            <span className="field-label">City and country (optional)</span>
            <input className="field-input" name="location" placeholder="Tokyo, Japan" type="text" />
          </label>
          <label className="field-shell">
            <span className="field-label">Web address (optional)</span>
            <input className="field-input" name="slug" placeholder="2027-city-name" type="text" />
            <span className="mt-1.5 block text-sm text-foreground/60">
              The page will live at /conferences/ followed by this. Leave blank to use the name.
            </span>
          </label>
          {copyOptions.length ? (
            <label className="field-shell">
              <span className="field-label">Start from</span>
              <select className="field-input" defaultValue="" name="copyFrom">
                <option value="">A blank page</option>
                {copyOptions.map((conference) => (
                  <option key={conference.id} value={conference.id}>
                    A copy of “{conference.title}”
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-sm text-foreground/60">
                Copying brings over the other conference’s text and sections for you to rewrite.
              </span>
            </label>
          ) : null}
          <div>
            <button className="button-link primary" type="submit">
              Create draft conference
            </button>
          </div>
        </form>
      </section>
    </AccountPageShell>
  );
}
