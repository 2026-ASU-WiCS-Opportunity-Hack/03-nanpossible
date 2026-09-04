import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import { getPartnerById } from "@/lib/partners";
import { deletePartnerAction, updatePartnerAction } from "../actions";
import { partnerError, partnerNotice } from "../messages";

type PartnerEditPageProps = {
  params: Promise<{ partnerId: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function PartnerEditPage({ params, searchParams }: PartnerEditPageProps) {
  const { partnerId } = await params;
  await requireAccountViewer(`/admin/global/partners/${partnerId}`, ["platform_admin"]);
  const [query, partner] = await Promise.all([searchParams, getPartnerById(partnerId)]);

  if (!partner) {
    notFound();
  }

  const notice = partnerNotice(query.notice);
  const errorMessage = partnerError(query.error);

  return (
    <AccountPageShell
      badge="Directory"
      description="Update how this partner appears on the public Partners page."
      eyebrow="Global admin"
      title={partner.name}
    >
      {notice ? <div className="account-flash is-success">{notice}</div> : null}
      {errorMessage ? <div className="account-flash is-error">{errorMessage}</div> : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link className="button-link ghost" href="/admin/global/partners">
            ← All partners
          </Link>
          {partner.directoryUrl ? (
            <a className="text-sm font-semibold text-teal-deep underline" href={partner.directoryUrl} rel="noreferrer" target="_blank">
              Listing on directory.wial.org
            </a>
          ) : null}
        </div>

        <form action={updatePartnerAction} className="mt-6 grid gap-4">
          <input name="id" type="hidden" value={partner.id} />
          <input name="slug" type="hidden" value={partner.slug} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-shell md:col-span-2">
              <span className="field-label">Organization name</span>
              <input className="field-input" defaultValue={partner.name} name="name" required type="text" />
            </label>
            <label className="field-shell md:col-span-2">
              <span className="field-label">Website</span>
              <input className="field-input" defaultValue={partner.websiteUrl ?? ""} name="website" placeholder="https://example.org" type="text" />
            </label>
            <label className="field-shell md:col-span-2">
              <span className="field-label">Short description</span>
              <textarea className="field-input min-h-32" defaultValue={partner.description ?? ""} name="description" />
            </label>
            <label className="field-shell">
              <span className="field-label">City</span>
              <input className="field-input" defaultValue={partner.city ?? ""} name="city" type="text" />
            </label>
            <label className="field-shell">
              <span className="field-label">State or province</span>
              <input className="field-input" defaultValue={partner.stateProvince ?? ""} name="stateProvince" type="text" />
            </label>
            <label className="field-shell">
              <span className="field-label">Country</span>
              <input className="field-input" defaultValue={partner.country ?? ""} name="country" type="text" />
            </label>
            <label className="field-shell">
              <span className="field-label">Display order</span>
              <input className="field-input" defaultValue={partner.sortOrder} name="sortOrder" type="number" />
            </label>
          </div>

          <div className="grid gap-4 border-t border-line pt-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-4">
              <label className="field-shell">
                <span className="field-label">Replace logo (PNG, JPEG, WebP, GIF, or SVG up to 2 MB)</span>
                <input accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="field-input" name="logoFile" type="file" />
              </label>
              <label className="field-shell">
                <span className="field-label">Logo web address</span>
                <input className="field-input" defaultValue={partner.logoUrl ?? ""} name="logoUrl" type="text" />
              </label>
            </div>
            <div className="flex h-32 w-44 items-center justify-center overflow-hidden rounded-[1rem] border border-line bg-white p-3">
              {partner.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={`${partner.name} logo`} className="max-h-full max-w-full object-contain" src={partner.logoUrl} />
              ) : (
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/45">No logo</span>
              )}
            </div>
          </div>

          <label className="coach-checkbox">
            <input defaultChecked={partner.active} name="active" type="checkbox" />
            <span>Show on the public Partners page</span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button className="button-link primary" type="submit">
              Save changes
            </button>
          </div>
        </form>

        <form action={deletePartnerAction} className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <input name="id" type="hidden" value={partner.id} />
          <p className="text-sm text-foreground/70">
            Removing a partner deletes it from this list. To take it off the public page temporarily, untick the box above instead.
          </p>
          <button className="button-link ghost" type="submit">
            Remove partner
          </button>
        </form>
      </section>
    </AccountPageShell>
  );
}
