"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccountViewer } from "@/lib/auth";
import {
  archivePaymentType,
  clearStripeSecretKey,
  createPaymentType,
  PaymentsError,
  saveStripeSecretKey,
} from "@/lib/payments";
import { SUPPORTED_CURRENCIES, toMinorUnits } from "@/lib/payments-format";

const ADMIN_PATH = "/admin/global/payments";

function back(params: Record<string, string>): never {
  redirect(`${ADMIN_PATH}?${new URLSearchParams(params).toString()}`);
}

function errorCode(error: unknown, fallback: string) {
  return error instanceof PaymentsError ? error.code : fallback;
}

export async function saveStripeKeyAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const key = String(formData.get("secretKey") ?? "");
  try {
    await saveStripeSecretKey(key);
  } catch (error) {
    back({ error: errorCode(error, "save-failed") });
  }
  revalidatePath("/pay");
  back({ notice: "key-saved" });
}

export async function clearStripeKeyAction() {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  try {
    await clearStripeSecretKey();
  } catch (error) {
    back({ error: errorCode(error, "save-failed") });
  }
  revalidatePath("/pay");
  back({ notice: "key-cleared" });
}

export async function createPaymentTypeAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const currency = String(formData.get("currency") ?? "usd").trim().toLowerCase();
  const amount = toMinorUnits(String(formData.get("amount") ?? ""), currency);

  if (!name) {
    back({ error: "name-required" });
  }
  if (!SUPPORTED_CURRENCIES.some((entry) => entry.code === currency)) {
    back({ error: "invalid-currency" });
  }
  if (amount === null) {
    back({ error: "invalid-amount" });
  }

  try {
    await createPaymentType({ name, description, amount, currency });
  } catch (error) {
    back({ error: errorCode(error, "stripe-failed") });
  }
  revalidatePath("/pay");
  back({ notice: "type-created" });
}

export async function archivePaymentTypeAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    back({ error: "stripe-failed" });
  }
  try {
    await archivePaymentType(productId);
  } catch (error) {
    back({ error: errorCode(error, "stripe-failed") });
  }
  revalidatePath("/pay");
  back({ notice: "type-archived" });
}
