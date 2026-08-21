import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import { EmailImportWorkbench } from "./EmailImportWorkbench";

export default async function CoachEmailImportPage() {
  await requireAccountViewer("/admin/global/coaches/emails", ["platform_admin"]);

  return (
    <AccountPageShell
      badge="Coach roster"
      description="Paste a list of names and email addresses, or upload a CSV. Every match is shown for review before anything is saved, and coaches who already have an email are never changed."
      eyebrow="Global admin"
      title="Add coach email addresses"
    >
      <EmailImportWorkbench />
    </AccountPageShell>
  );
}
