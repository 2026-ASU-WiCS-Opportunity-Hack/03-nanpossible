import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountPageShell } from "@/components/account-page-shell";
import { ChapterSettingsForm } from "@/components/admin/ChapterSettingsForm";
import { affiliateSiteUrl } from "@/lib/affiliates";
import { requireAccountViewer } from "@/lib/auth";
import { getChapterById, listTakenCountries } from "@/lib/tenant";
import { saveChapterAction } from "./actions";

type EditChapterPageProps = {
  params: Promise<{ chapterId: string }>;
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
    case "invalid-website":
      return "Enter a full website address (https://...) or leave it blank to use the hosted site.";
    case "save-failed":
      return "WIAL could not save these settings.";
    default:
      return null;
  }
}

export default async function EditChapterPage({
  params,
  searchParams,
}: EditChapterPageProps) {
  await requireAccountViewer("/admin/global/chapters", ["platform_admin"]);
  const [{ chapterId }, query] = await Promise.all([params, searchParams]);
  const chapter = await getChapterById(chapterId);

  if (!chapter) {
    notFound();
  }

  const takenCountries = await listTakenCountries(chapter.id);
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000";

  return (
    <AccountPageShell
      badge="Affiliate profile"
      description="Update this affiliate's public details, including where the affiliates directory sends visitors."
      eyebrow="Global admin"
      title={chapter.name}
    >
      {getNotice(query.notice) ? (
        <div className="account-flash is-success">{getNotice(query.notice)}</div>
      ) : null}
      {getError(query.error) ? (
        <div className="account-flash is-error">{getError(query.error)}</div>
      ) : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/65">
            Directory link:{" "}
            <a
              className="font-semibold text-teal"
              href={affiliateSiteUrl(chapter, siteDomain)}
              rel="noreferrer"
              target="_blank"
            >
              {affiliateSiteUrl(chapter, siteDomain)}
            </a>
          </p>
          <Link className="button-link secondary" href="/admin/global/chapters">
            Back to affiliates
          </Link>
        </div>

        <ChapterSettingsForm
          action={saveChapterAction}
          chapter={chapter}
          takenCountries={takenCountries}
        />
      </section>
    </AccountPageShell>
  );
}
