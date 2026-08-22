import { notFound } from "next/navigation";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import { getGlobalPageBySlugForAdmin } from "@/lib/content";
import { PageContentEditor } from "./PageContentEditor";

type GlobalPageEditorPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GlobalPageEditorPage({
  params,
}: GlobalPageEditorPageProps) {
  const { slug } = await params;
  await requireAccountViewer(`/admin/global/pages/${slug}`, ["platform_admin"]);

  const page = await getGlobalPageBySlugForAdmin(slug);
  if (!page) {
    notFound();
  }

  return (
    <AccountPageShell
      badge="Site pages"
      description="Changes go live on the public site as soon as you save."
      eyebrow="Global admin"
      title={`Edit: ${page.title}`}
    >
      <PageContentEditor
        initialBody={page.bodyRichtext}
        initialPublished={page.published}
        initialTitle={page.title}
        slug={slug}
      />
    </AccountPageShell>
  );
}
