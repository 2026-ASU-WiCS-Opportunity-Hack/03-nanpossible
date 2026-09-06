import Link from "next/link";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import { listPartners } from "@/lib/partners";
import { partnerLocation, websiteHost } from "@/lib/partners-fields";
import { createPartnerAction, setPartnerActiveAction } from "./actions";
import { partnerError, partnerNotice } from "./messages";

type PartnersAdminPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function PartnersAdminPage({ searchParams }: PartnersAdminPageProps) {
  await requireAccountViewer("/admin/global/partners", ["platform_admin"]);
  const [query, partners] = await Promise.all([
    searchParams,
    listPartners({ includeInactive: true }),
  ]);
  const notice = partnerNotice(query.notice);
  const errorMessage = partnerError(query.error);
  const shownCount = partners.filter((partner) => partner.active).length;

  return (
    <AccountPageShell
      badge="Directory"
      description="Choose which partner organizations appear on the public Partners page and keep their logos, websites, and descriptions current."
      eyebrow="Global admin"
      title="Partners"
    >
      {notice ? <div className="account-flash is-success">{notice}</div> : null}
      {errorMessage ? <div className="account-flash is-error">{errorMessage}</div> : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Partner organizations</p>
            <p className="text-base leading-7 text-foreground/75">
              {shownCount} of {partners.length} {partners.length === 1 ? "partner is" : "partners are"}{" "}
              shown on the public page — as a logo when one is set, otherwise as a name tile.
              Hidden partners stay off the page.
            </p>
          </div>
          <Link className="button-link secondary" href="/partners" rel="noreferrer" target="_blank">
            View the public Partners page
          </Link>
        </div>

        {partners.length > 0 ? (
          <ul className="mt-6 grid gap-3">
            {partners.map((partner) => {
              const location = partnerLocation(partner);
              const host = websiteHost(partner.websiteUrl);
              return (
                <li
                  className="feature-card flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem]"
                  key={partner.id}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] border border-line bg-white p-2">
                      {partner.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="max-h-full max-w-full object-contain"
                          src={partner.logoUrl}
                        />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
                          No logo
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h3 className="flex flex-wrap items-center gap-2">
                        {partner.name}
                        {!partner.active ? <span className="coach-result-chip">Hidden</span> : null}
                      </h3>
                      <p className="text-sm text-foreground/70">
                        {[location, host].filter(Boolean).join(" · ") || "No location or website yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link className="button-link secondary" href={`/admin/global/partners/${partner.id}`}>
                      Edit
                    </Link>
                    <form action={setPartnerActiveAction}>
                      <input name="id" type="hidden" value={partner.id} />
                      <input name="active" type="hidden" value={partner.active ? "false" : "true"} />
                      <button className="button-link ghost" type="submit">
                        {partner.active ? "Hide" : "Show"}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 text-base text-foreground/70">
            No partners yet. Add the first one below.
          </p>
        )}

        <form action={createPartnerAction} className="mt-8 grid gap-4 border-t border-line pt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Add a partner
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-shell md:col-span-2">
              <span className="field-label">Organization name</span>
              <input className="field-input" name="name" placeholder="Carson Consultants" required type="text" />
            </label>
            <label className="field-shell">
              <span className="field-label">Website</span>
              <input className="field-input" name="website" placeholder="https://example.org" type="text" />
            </label>
            <label className="field-shell">
              <span className="field-label">Country</span>
              <input className="field-input" name="country" placeholder="United States" type="text" />
            </label>
            <label className="field-shell">
              <span className="field-label">Logo file</span>
              <input accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="field-input" name="logoFile" type="file" />
            </label>
            <label className="field-shell">
              <span className="field-label">Or logo web address</span>
              <input className="field-input" name="logoUrl" placeholder="https://example.org/logo.png" type="text" />
            </label>
            <label className="field-shell md:col-span-2">
              <span className="field-label">Short description</span>
              <textarea className="field-input min-h-24" name="description" />
            </label>
          </div>
          <input name="active" type="hidden" value="on" />
          <div>
            <button className="button-link primary" type="submit">
              Add partner
            </button>
          </div>
        </form>
      </section>
    </AccountPageShell>
  );
}
