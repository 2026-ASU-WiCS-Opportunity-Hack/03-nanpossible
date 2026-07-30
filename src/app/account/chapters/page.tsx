import { AccountPlaceholder } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";

export default async function ChaptersPage() {
  await requireAccountViewer("/account/chapters", ["platform_admin"]);

  return (
    <AccountPlaceholder
      bullets={[
        "Manage the global affiliate registry and affiliate-head assignments",
        "Review affiliate status, tenant metadata, and readiness for rollout",
        "Prepare future invite and governance workflows for affiliate leads",
      ]}
      description="This route is reserved for global administrators who manage affiliates and their leaders."
      eyebrow="Admin workspace"
      focusLabel="Network administration"
      title="Affiliates and Affiliate Heads"
    />
  );
}
