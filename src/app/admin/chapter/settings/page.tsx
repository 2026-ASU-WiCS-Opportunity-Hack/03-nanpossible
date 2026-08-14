import { AccountPageShell } from "@/components/account-page-shell";
import { ChapterSettingsForm } from "@/components/admin/ChapterSettingsForm";
import { requireAccountViewer } from "@/lib/auth";
import { resolveWorkspaceChapter } from "@/lib/chapter-workspace";
import { listTakenCountries } from "@/lib/tenant";
import { saveChapterSettingsAction } from "./actions";

type ChapterSettingsPageProps = {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

function getNotice(notice?: string) {
  switch (notice) {
    case "saved":
      return "Affiliate settings saved.";
    default:
      return null;
  }
}

function getError(error?: string) {
  switch (error) {
    case "missing-chapter":
      return "Affiliate context is missing.";
    case "forbidden":
      return "This account cannot edit affiliate settings.";
    case "invalid-website":
      return "Enter a full website address (https://...) or leave it blank to use the hosted site.";
    case "save-failed":
      return "WIAL could not save these settings.";
    default:
      return null;
  }
}

export default async function ChapterSettingsPage({
  searchParams,
}: ChapterSettingsPageProps) {
  const viewer = await requireAccountViewer("/admin/chapter/settings", [
    "platform_admin",
    "chapter_admin",
  ]);
  const chapter = await resolveWorkspaceChapter(viewer);
  const params = await searchParams;

  if (!chapter) {
    return null;
  }

  const takenCountries = await listTakenCountries(chapter.id);

  return (
    <AccountPageShell
      badge="Affiliate settings"
      description="Update the affiliate profile that powers the homepage hero, contact details, and affiliate-wide identity."
      eyebrow="Affiliate workspace"
      title="Settings"
    >
      {getNotice(params.notice) ? (
        <div className="account-flash is-success">{getNotice(params.notice)}</div>
      ) : null}
      {getError(params.error) ? (
        <div className="account-flash is-error">{getError(params.error)}</div>
      ) : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <ChapterSettingsForm
          action={saveChapterSettingsAction}
          chapter={chapter}
          takenCountries={takenCountries}
        />
      </section>
    </AccountPageShell>
  );
}
