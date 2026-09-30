import Link from "next/link";
import type { ReactNode } from "react";
import { AccountPageShell } from "@/components/account-page-shell";
import type { WorkspaceGap } from "@/lib/workspace-gap";

type AffiliateWorkspaceNoticeProps = {
  gap: WorkspaceGap;
  viewerEmail: string;
};

type NoticeAction =
  | { kind: "link"; href: string; label: string; primary?: boolean }
  | { kind: "sign-out"; label: string };

type NoticeContent = {
  badge: string;
  title: string;
  description: string;
  stepsLabel: string;
  steps: ReactNode[];
  actions: NoticeAction[];
};

const SIGN_IN_STEP = "Sign out and sign back in. Your access updates the next time you sign in.";

function adminStep(field: string) {
  return `Ask them to open Admin, then Users & roles, find your account, choose Edit, and set ${field}.`;
}

function contactStep(email: string, extra?: string): ReactNode {
  return (
    <>
      Contact a WIAL platform admin and give them the email on this account:{" "}
      <strong className="font-semibold text-teal-deep">{email}</strong>
      {extra ? <> {extra}</> : null}
    </>
  );
}

const helpActions: NoticeAction[] = [
  { kind: "link", href: "/contact", label: "Contact WIAL", primary: true },
  { kind: "sign-out", label: "Sign out" },
  { kind: "link", href: "/guide", label: "Platform guide" },
];

function buildContent(gap: WorkspaceGap, viewerEmail: string): NoticeContent {
  switch (gap.kind) {
    case "choose":
      return {
        badge: "Pick an affiliate",
        title: "Choose an affiliate to manage",
        description:
          "Affiliate workspaces open on each affiliate's own web address. Pick an affiliate from the list, or open its site and add /admin/chapter to the address.",
        stepsLabel: "How to get there",
        steps: [
          "Open Affiliates and find the affiliate you want to manage.",
          "Open its site, then add /admin/chapter to the address to reach its workspace.",
        ],
        actions: [
          { kind: "link", href: "/admin/global/chapters", label: "Browse affiliates", primary: true },
          { kind: "link", href: "/admin/global", label: "Back to platform admin" },
        ],
      };
    case "unassigned":
      if (gap.role === "content_creator") {
        return {
          badge: "Action needed",
          title: "No affiliates are assigned to you yet",
          stepsLabel: "How to fix this",
          description:
            "You are set up as a content creator, but no affiliates are assigned to your account, so there is nothing to edit here yet. A WIAL platform admin can fix this in about a minute.",
          steps: [
            contactStep(viewerEmail),
            adminStep("Assigned affiliates to the affiliates you write for"),
            SIGN_IN_STEP,
          ],
          actions: helpActions,
        };
      }

      return {
        badge: "Action needed",
        title: "Your account is not linked to an affiliate yet",
        stepsLabel: "How to fix this",
        description:
          "You are set up as an affiliate head, but no affiliate is attached to your account, so there is nothing to manage here yet. A WIAL platform admin can fix this in about a minute.",
        steps: [
          contactStep(viewerEmail),
          adminStep("Primary affiliate to your affiliate"),
          SIGN_IN_STEP,
        ],
        actions: helpActions,
      };
    case "unavailable": {
      const name = gap.chapterName;
      const reason =
        gap.status === "draft"
          ? "has not been published yet. Its workspace stays closed until a WIAL platform admin makes it active."
          : gap.status === "inactive"
            ? "has been switched off, so its workspace is closed."
            : "could not be found, so its workspace cannot open.";

      return {
        badge: "Action needed",
        title: name ? `${name} is not available right now` : "Your affiliate is not available right now",
        stepsLabel: "How to fix this",
        description: `Your account is linked to ${name ?? "an affiliate"}, but that affiliate ${reason}`,
        steps: [
          contactStep(viewerEmail, name ? `Mention the affiliate name: ${name}.` : undefined),
          "Ask them to make the affiliate active, or move your account to a different affiliate under Admin, Users & roles.",
          SIGN_IN_STEP,
        ],
        actions: helpActions,
      };
    }
  }
}

/**
 * Shown by the /admin/chapter layout when the signed-in account has no
 * affiliate workspace to open: says what is wrong, who fixes it, and how.
 */
export function AffiliateWorkspaceNotice({ gap, viewerEmail }: AffiliateWorkspaceNoticeProps) {
  const content = buildContent(gap, viewerEmail);

  return (
    <AccountPageShell
      badge={content.badge}
      description={content.description}
      eyebrow="Affiliate workspace"
      title={content.title}
    >
      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <p className="eyebrow">{content.stepsLabel}</p>
        <ol className="mt-5 list-none space-y-4 p-0">
          {content.steps.map((step, index) => (
            <li
              className="flex items-start gap-3 text-base leading-7 text-foreground/78"
              key={index}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-teal-deep"
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex flex-wrap gap-3">
          {content.actions.map((action) =>
            action.kind === "sign-out" ? (
              <form action="/auth/sign-out" key="sign-out" method="post">
                <button className="button-link secondary" type="submit">
                  {action.label}
                </button>
              </form>
            ) : (
              <Link
                className={`button-link ${action.primary ? "primary" : "secondary"}`}
                href={action.href}
                key={action.href}
              >
                {action.label}
              </Link>
            ),
          )}
        </div>
      </section>
    </AccountPageShell>
  );
}
