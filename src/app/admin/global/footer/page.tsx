import { notFound } from "next/navigation";
import { AccountPageShell } from "@/components/account-page-shell";
import { GlobalFooterEditor } from "@/components/admin/GlobalFooterEditor";
import { requireAccountViewer } from "@/lib/auth";
import { getGlobalContentPageForAdmin } from "@/lib/content";
import { parseGlobalFooterState } from "@/lib/global-footer";

export default async function GlobalFooterAdminPage() {
  await requireAccountViewer("/admin/global/footer", ["platform_admin"]);

  const footerPage = await getGlobalContentPageForAdmin("global-footer");

  if (!footerPage) {
    notFound();
  }

  return (
    <AccountPageShell
      badge="Global content"
      description="Edit, preview, save, and publish the footer displayed across the WIAL platform."
      eyebrow="Platform admin"
      title="Global footer"
    >
      <GlobalFooterEditor
        initialState={parseGlobalFooterState(footerPage.bodyJson)}
        pageId={footerPage.id}
      />
    </AccountPageShell>
  );
}
