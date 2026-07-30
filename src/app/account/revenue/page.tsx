import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import { RevenueClient } from "./RevenueClient";

export default async function RevenuePage() {
  await requireAccountViewer("/account/revenue", ["chapter_admin"]);

  return (
    <AccountPageShell
      badge="Finance dashboard live"
      description="Monitor affiliate dues, paid totals, and payment trends in real-time."
      eyebrow="Affiliate workspace"
      title="Affiliate revenue dashboard"
    >
      <RevenueClient />
    </AccountPageShell>
  );
}
