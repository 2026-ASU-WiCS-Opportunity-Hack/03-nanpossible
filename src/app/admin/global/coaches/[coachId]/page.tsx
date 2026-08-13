import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountPageShell } from "@/components/account-page-shell";
import { CoachSettingsForm } from "@/components/admin/CoachSettingsForm";
import { requireAccountViewer } from "@/lib/auth";
import { getCoachByIdForAdmin } from "@/lib/coaches";
import { listChapters } from "@/lib/tenant";
import { saveCoachAction } from "./actions";

type EditCoachPageProps = {
  params: Promise<{ coachId: string }>;
  searchParams: Promise<{
    notice?: string;
    error?: string;
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

function getError(error?: string) {
  switch (error) {
    case "name-required":
      return "Enter the coach's name.";
    case "slug-taken":
      return "Another coach already uses that profile link. Pick a different slug.";
    case "slug-invalid":
      return "Profile links may only use lowercase letters, numbers, and hyphens.";
    case "save-failed":
      return "WIAL could not save these coach details.";
    default:
      return null;
  }
}

export default async function EditCoachPage({
  params,
  searchParams,
}: EditCoachPageProps) {
  await requireAccountViewer("/admin/global/coaches", ["platform_admin"]);
  const [{ coachId }, query] = await Promise.all([params, searchParams]);
  const [coach, chapters] = await Promise.all([
    getCoachByIdForAdmin(coachId),
    listChapters(),
  ]);

  if (!coach) {
    notFound();
  }

  return (
    <AccountPageShell
      badge="Coach profile"
      description="Update this coach's public profile. Changes appear on the directory immediately after saving."
      eyebrow="Global admin"
      title={coach.name}
    >
      {getNotice(query.notice) ? (
        <div className="account-flash is-success">{getNotice(query.notice)}</div>
      ) : null}
      {getError(query.error) ? (
        <div className="account-flash is-error">{getError(query.error)}</div>
      ) : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {coach.approved ? (
            <Link
              className="button-link ghost"
              href={`/coaches/${encodeURIComponent(coach.slug ?? coach.id)}`}
            >
              View public profile
            </Link>
          ) : (
            <p className="text-sm text-foreground/65">
              This coach is not approved yet, so the public profile is hidden.
            </p>
          )}
          <Link className="button-link secondary" href="/admin/global/coaches">
            Back to coaches
          </Link>
        </div>

        <CoachSettingsForm action={saveCoachAction} chapters={chapters} coach={coach} />
      </section>
    </AccountPageShell>
  );
}
