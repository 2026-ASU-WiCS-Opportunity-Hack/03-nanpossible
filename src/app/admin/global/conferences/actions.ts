"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccountViewer } from "@/lib/auth";
import {
  createConference,
  deleteConference,
  setConferenceArchived,
  updateConferenceDetails,
} from "@/lib/conferences";
import {
  ConferencesError,
  parseConferenceDetails,
  slugifyConference,
} from "@/lib/conferences-fields";

const ADMIN_PATH = "/admin/global/conferences";

function back(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

function errorCode(error: unknown) {
  return error instanceof ConferencesError ? error.code : "save-failed";
}

function revalidateConferences(...paths: string[]) {
  revalidatePath("/conferences");
  revalidatePath(ADMIN_PATH);
  revalidatePath("/admin/global/pages");
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function createConferenceAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const title = String(formData.get("title") ?? "").trim();
  let failure: string | null = null;
  let createdId: string | null = null;

  try {
    if (!title) {
      throw new ConferencesError("title-required");
    }
    const details = parseConferenceDetails({
      // Left blank, the web address comes from the name.
      slug: String(formData.get("slug") ?? "").trim() || slugifyConference(title),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      location: formData.get("location"),
    });
    const copyFromId = String(formData.get("copyFrom") ?? "").trim() || null;
    createdId = (await createConference({ title, details, copyFromId })).id;
  } catch (error) {
    failure = errorCode(error);
  }

  if (failure || !createdId) {
    back(ADMIN_PATH, { error: failure ?? "save-failed" });
  }
  revalidateConferences();
  back(`${ADMIN_PATH}/${createdId}`, { notice: "created" });
}

export async function updateConferenceDetailsAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    back(ADMIN_PATH, { error: "not-found" });
  }
  const editPath = `${ADMIN_PATH}/${id}`;
  let failure: string | null = null;
  let paths: string[] = [];

  try {
    const details = parseConferenceDetails({
      slug: formData.get("slug"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      location: formData.get("location"),
    });
    const result = await updateConferenceDetails(id, details, formData.get("archived") === "on");
    paths = [result.previousPath, result.path];
  } catch (error) {
    failure = errorCode(error);
  }

  if (failure) {
    back(failure === "not-found" ? ADMIN_PATH : editPath, { error: failure });
  }
  revalidateConferences(...paths);
  back(editPath, { notice: "saved" });
}

export async function setConferenceArchivedAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const id = String(formData.get("id") ?? "").trim();
  const archived = formData.get("archived") === "true";
  const path = String(formData.get("path") ?? "").trim();
  let failure: string | null = null;

  try {
    await setConferenceArchived(id, archived);
  } catch (error) {
    failure = errorCode(error);
  }

  if (failure) {
    back(ADMIN_PATH, { error: failure });
  }
  revalidateConferences(...(path.startsWith("/conferences/") ? [path] : []));
  back(ADMIN_PATH, { notice: archived ? "archived" : "restored" });
}

export async function deleteConferenceAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const id = String(formData.get("id") ?? "").trim();
  if (formData.get("confirm") !== "on") {
    back(`${ADMIN_PATH}/${id}`, { error: "confirm-required" });
  }
  let failure: string | null = null;
  let path: string | null = null;

  try {
    path = (await deleteConference(id)).path;
  } catch (error) {
    failure = errorCode(error);
  }

  if (failure) {
    back(ADMIN_PATH, { error: failure });
  }
  revalidateConferences(...(path ? [path] : []));
  back(ADMIN_PATH, { notice: "deleted" });
}
