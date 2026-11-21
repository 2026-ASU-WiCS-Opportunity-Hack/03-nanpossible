"use server";

import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAccountViewer } from "@/lib/auth";
import {
  buildAuthorizeUrl,
  CONSTANT_CONTACT_CALLBACK_PATH,
  constantContactRedirectUri,
  disconnectConstantContact,
  getConstantContactClientId,
  listConstantContactLists,
  saveConstantContactCredentials,
  saveConstantContactList,
} from "@/lib/constant-contact";
import { syncWaitingSubscribers } from "@/lib/newsletter";

const ADMIN_PATH = "/admin/global/newsletter";
const STATE_COOKIE = "cc_oauth_state";

function back(params: Record<string, string>): never {
  redirect(`${ADMIN_PATH}?${new URLSearchParams(params).toString()}`);
}

async function requestHost() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
}

export async function saveCredentialsAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();

  if (!clientId || !clientSecret) {
    back({ error: "credentials-required" });
  }
  if (!(await saveConstantContactCredentials(clientId, clientSecret))) {
    back({ error: "save-failed" });
  }
  back({ notice: "credentials-saved" });
}

/** Sends the admin to Constant Contact to approve access; the callback route finishes the job. */
export async function connectAction() {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const clientId = await getConstantContactClientId();
  if (!clientId) {
    back({ error: "credentials-required" });
  }

  const state = randomBytes(24).toString("hex");
  const host = await requestHost();
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: !host.startsWith("localhost") && !host.startsWith("127.0.0.1"),
    path: CONSTANT_CONTACT_CALLBACK_PATH,
    maxAge: 600,
  });

  redirect(
    buildAuthorizeUrl({ clientId, redirectUri: constantContactRedirectUri(host), state }),
  );
}

export async function saveListAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const listId = String(formData.get("listId") ?? "").trim();
  // Only accept a list that really exists in the connected account.
  const list = (await listConstantContactLists())?.find((item) => item.id === listId);
  if (!list) {
    back({ error: "list-required" });
  }
  if (!(await saveConstantContactList(list))) {
    back({ error: "save-failed" });
  }
  back({ notice: "list-saved" });
}

export async function syncWaitingAction() {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const result = await syncWaitingSubscribers();
  if (result === "not-ready") {
    back({ error: "not-ready" });
  }
  if (result === "unavailable") {
    back({ error: "save-failed" });
  }
  back({ notice: "synced", sent: String(result.sent), attempted: String(result.attempted) });
}

export async function disconnectAction() {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  if (!(await disconnectConstantContact())) {
    back({ error: "save-failed" });
  }
  back({ notice: "disconnected" });
}
