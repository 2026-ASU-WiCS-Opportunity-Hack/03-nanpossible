import { headers } from "next/headers";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import {
  constantContactRedirectUri,
  getConstantContactStatus,
  listConstantContactLists,
  type ConstantContactList,
} from "@/lib/constant-contact";
import { getNewsletterStats } from "@/lib/newsletter";
import {
  connectAction,
  disconnectAction,
  saveCredentialsAction,
  saveListAction,
  syncWaitingAction,
} from "./actions";

type NewsletterAdminPageProps = {
  searchParams: Promise<{ notice?: string; error?: string; sent?: string; attempted?: string }>;
};

function getNotice(query: Awaited<NewsletterAdminPageProps["searchParams"]>) {
  switch (query.notice) {
    case "credentials-saved":
      return "API key and secret saved. Next, connect the Constant Contact account.";
    case "connected":
      return "Constant Contact is connected. Choose the list new subscribers should join.";
    case "list-saved":
      return "List saved. New subscribers are now added to Constant Contact.";
    case "synced":
      return `Sent ${query.sent ?? "0"} of ${query.attempted ?? "0"} waiting signups to Constant Contact.`;
    case "disconnected":
      return "Constant Contact was disconnected. Signups are still collected on this site.";
    default:
      return null;
  }
}

function getError(error?: string) {
  switch (error) {
    case "credentials-required":
      return "Enter both the API key and the client secret.";
    case "save-failed":
      return "WIAL could not store that. Check the Supabase service-role configuration.";
    case "authorization-denied":
      return "Constant Contact did not grant access. Try connecting again and choose Allow.";
    case "authorization-expired":
      return "That sign-in attempt expired. Please connect again.";
    case "rejected":
      return "Constant Contact rejected the connection. Check the API key, the client secret, and that the redirect address below is registered in the application.";
    case "no-refresh-token":
      return "Constant Contact did not return long-term access. In the application settings, make sure refresh tokens are enabled, then connect again.";
    case "not-configured":
      return "Save the API key and client secret first.";
    case "list-required":
      return "Choose one of the lists from the connected account.";
    case "not-ready":
      return "Finish connecting Constant Contact and choose a list first.";
    default:
      return null;
  }
}

function StepBadge({ done, index }: { done: boolean; index: number }) {
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        done ? "bg-green text-white" : "bg-teal-deep/10 text-teal-deep"
      }`}
    >
      <span aria-hidden="true">{done ? "✓" : index}</span>
      <span className="sr-only">{done ? `Step ${index} done` : `Step ${index}`}</span>
    </span>
  );
}

export default async function NewsletterAdminPage({ searchParams }: NewsletterAdminPageProps) {
  await requireAccountViewer("/admin/global/newsletter", ["platform_admin"]);
  const [query, status, stats, headerStore] = await Promise.all([
    searchParams,
    getConstantContactStatus(),
    getNewsletterStats(),
    headers(),
  ]);

  const lists: ConstantContactList[] | null = status.connected
    ? await listConstantContactLists()
    : null;
  const redirectUri = constantContactRedirectUri(
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000",
  );
  const notice = getNotice(query);
  const errorMessage = getError(query.error);

  return (
    <AccountPageShell
      badge="Constant Contact"
      description="Connect WIAL's Constant Contact account so people who subscribe on the website are added to your mailing list."
      eyebrow="Global admin"
      title="Newsletter"
    >
      {notice ? <div className="account-flash is-success">{notice}</div> : null}
      {errorMessage ? <div className="account-flash is-error">{errorMessage}</div> : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <p className="eyebrow">Status</p>
        <p className="mt-3 text-base leading-7 text-foreground/75">
          {status.ready
            ? `Connected. New subscribers are added to “${status.listName ?? "your list"}”.`
            : "Not connected yet. Signups are still collected on this site and can be sent to Constant Contact once the three steps below are done."}
        </p>
        {stats ? (
          <p className="mt-2 text-sm text-foreground/65">
            {stats.total} {stats.total === 1 ? "signup" : "signups"} collected on the website,{" "}
            {stats.waiting} not yet in Constant Contact.
          </p>
        ) : null}
        {status.ready && stats && stats.waiting > 0 ? (
          <form action={syncWaitingAction} className="mt-4">
            <button className="button-link secondary" type="submit">
              Send waiting signups to Constant Contact
            </button>
          </form>
        ) : null}
      </section>

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <StepBadge done={status.hasCredentials} index={1} />
          <h2 className="text-lg font-semibold">Enter the application&apos;s API key and secret</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Create an application at{" "}
          <a
            className="font-semibold text-teal underline underline-offset-4"
            href="https://app.constantcontact.com/pages/dma/portal/"
            rel="noreferrer"
            target="_blank"
          >
            Constant Contact&apos;s developer portal
          </a>{" "}
          (authorization code flow, with a client secret), and add this redirect address to it:
        </p>
        <p className="mt-2 break-all rounded-lg border border-line bg-white/70 px-3 py-2 font-mono text-sm">
          {redirectUri}
        </p>
        {status.hasCredentials ? (
          <p className="mt-3 text-sm text-foreground/65">
            An API key ending in {status.clientIdLastFour} is saved. Saving a new pair disconnects
            the account until you connect again.
          </p>
        ) : null}
        <form action={saveCredentialsAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="field-shell">
            <span className="field-label">API key (client ID)</span>
            <input autoComplete="off" className="field-input" name="clientId" required type="text" />
          </label>
          <label className="field-shell">
            <span className="field-label">Client secret</span>
            <input
              autoComplete="off"
              className="field-input"
              name="clientSecret"
              required
              type="password"
            />
          </label>
          <div className="md:col-span-2">
            <button className="button-link primary" type="submit">
              {status.hasCredentials ? "Replace key and secret" : "Save key and secret"}
            </button>
            <p className="mt-2 text-xs text-foreground/55">
              Both are stored encrypted and never shown again.
            </p>
          </div>
        </form>
      </section>

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <StepBadge done={status.connected} index={2} />
          <h2 className="text-lg font-semibold">Connect the Constant Contact account</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          {status.connected
            ? "The account is connected. Reconnect if access was revoked or you switched accounts."
            : "You will be sent to Constant Contact to sign in and allow access, then brought back here."}
        </p>
        <form action={connectAction} className="mt-4">
          <button
            className={`button-link ${status.connected ? "secondary" : "primary"}`}
            disabled={!status.hasCredentials}
            type="submit"
          >
            {status.connected ? "Reconnect" : "Connect Constant Contact"}
          </button>
          {!status.hasCredentials ? (
            <p className="mt-2 text-xs text-foreground/55">Finish step 1 first.</p>
          ) : null}
        </form>
      </section>

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <StepBadge done={Boolean(status.listId)} index={3} />
          <h2 className="text-lg font-semibold">Choose the list</h2>
        </div>
        {!status.connected ? (
          <p className="mt-3 text-sm text-foreground/65">Finish step 2 first.</p>
        ) : lists === null ? (
          <p className="mt-3 text-sm text-foreground/70">
            The lists could not be loaded from Constant Contact. Try reconnecting in step 2.
          </p>
        ) : lists.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/70">
            This Constant Contact account has no lists yet. Create one there, then reload this page.
          </p>
        ) : (
          <form action={saveListAction} className="mt-4 grid gap-4 md:max-w-md">
            <label className="field-shell">
              <span className="field-label">New subscribers join</span>
              <select
                className="field-input"
                defaultValue={status.listId ?? ""}
                name="listId"
                required
              >
                <option disabled value="">
                  Select a list
                </option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <button className="button-link primary" type="submit">
                Save list
              </button>
            </div>
          </form>
        )}
      </section>

      {status.hasCredentials ? (
        <section className="site-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-lg font-semibold">Disconnect</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Removes the saved key, secret, connection and list from this site. Signups keep being
            collected here; nothing is deleted in Constant Contact.
          </p>
          <form action={disconnectAction} className="mt-4">
            <button className="button-link secondary" type="submit">
              Disconnect Constant Contact
            </button>
          </form>
        </section>
      ) : null}
    </AccountPageShell>
  );
}
