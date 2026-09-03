import Stripe from "stripe";
import { describeStripeKey } from "@/lib/payments-format";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import type {
  PaymentRecord,
  PaymentType,
  StripeConfigStatus,
  UserProfile,
} from "@/lib/types";

/**
 * Stripe access for /pay and /admin/global/payments.
 *
 * The secret key lives in Supabase Vault (written from the admin page through
 * the service-role-only `set_platform_secret` RPC) and falls back to the
 * STRIPE_SECRET_KEY env var. Payment types are Stripe Products with a
 * one-time Price — admins manage them in the Stripe Dashboard or from the
 * admin page, never in our database. Completed Checkout Sessions are recorded
 * in `stripe_payments`.
 */

const STRIPE_SECRET_NAME = "stripe_secret_key";
const KEY_CACHE_TTL_MS = 60_000;

type ResolvedKey = {
  value: string | null;
  source: StripeConfigStatus["source"];
  expires: number;
};

let cachedKey: ResolvedKey | null = null;

async function readVaultKey(): Promise<string | null> {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client.rpc("get_platform_secret", {
    p_name: STRIPE_SECRET_NAME,
  });
  if (error) {
    console.warn("Could not read the Stripe key from Vault:", error.message);
    return null;
  }
  return typeof data === "string" && data.trim() ? data.trim() : null;
}

async function resolveStripeSecretKey(force = false): Promise<ResolvedKey> {
  if (!force && cachedKey && cachedKey.expires > Date.now()) {
    return cachedKey;
  }
  const vaultKey = await readVaultKey();
  const envKey = process.env.STRIPE_SECRET_KEY?.trim() || null;
  const value = vaultKey ?? envKey;
  cachedKey = {
    value,
    source: vaultKey ? "vault" : value ? "env" : "none",
    expires: Date.now() + KEY_CACHE_TTL_MS,
  };
  return cachedKey;
}

export function invalidateStripeKeyCache() {
  cachedKey = null;
}

/** A Stripe client for the configured key, or null when no key is configured. */
export async function getStripeClient(): Promise<Stripe | null> {
  const { value } = await resolveStripeSecretKey();
  return value ? new Stripe(value) : null;
}

export async function getStripeConfigStatus(): Promise<StripeConfigStatus> {
  const { value, source } = await resolveStripeSecretKey(true);
  const described = describeStripeKey(value);
  return {
    configured: Boolean(value),
    source,
    mode: described.mode,
    lastFour: described.lastFour,
  };
}

export class PaymentsError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

/** Validate a key against Stripe, then store it encrypted in Vault. */
export async function saveStripeSecretKey(rawKey: string): Promise<void> {
  const key = rawKey.trim();
  if (!describeStripeKey(key).valid) {
    throw new PaymentsError("invalid-key");
  }
  try {
    await new Stripe(key).balance.retrieve();
  } catch {
    throw new PaymentsError("key-rejected");
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    throw new PaymentsError("save-failed");
  }
  const { error } = await client.rpc("set_platform_secret", {
    p_name: STRIPE_SECRET_NAME,
    p_value: key,
  });
  if (error) {
    console.error("Could not store the Stripe key in Vault:", error.message);
    throw new PaymentsError("save-failed");
  }
  invalidateStripeKeyCache();
}

export async function clearStripeSecretKey(): Promise<void> {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    throw new PaymentsError("save-failed");
  }
  const { error } = await client.rpc("clear_platform_secret", {
    p_name: STRIPE_SECRET_NAME,
  });
  if (error) {
    throw new PaymentsError("save-failed");
  }
  invalidateStripeKeyCache();
}

function activeProduct(
  product: string | Stripe.Product | Stripe.DeletedProduct,
): Stripe.Product | null {
  if (typeof product === "string" || "deleted" in product) {
    return null;
  }
  return product.active ? product : null;
}

/** Active one-time prices with an active product — what /pay offers. */
export async function listPaymentTypes(): Promise<PaymentType[]> {
  const stripe = await getStripeClient();
  if (!stripe) {
    return [];
  }
  const prices = await stripe.prices.list({
    active: true,
    type: "one_time",
    expand: ["data.product"],
    limit: 100,
  });
  return prices.data
    .flatMap<PaymentType>((price) => {
      const product = activeProduct(price.product);
      if (!product || price.unit_amount === null) {
        return [];
      }
      return [
        {
          priceId: price.id,
          productId: product.id,
          name: product.name,
          nickname: price.nickname,
          description: product.description,
          amount: price.unit_amount,
          currency: price.currency,
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.amount - b.amount);
}

export async function createPaymentType(input: {
  name: string;
  description: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const stripe = await getStripeClient();
  if (!stripe) {
    throw new PaymentsError("stripe-not-configured");
  }
  await stripe.products.create({
    name: input.name,
    description: input.description || undefined,
    default_price_data: { currency: input.currency, unit_amount: input.amount },
    metadata: { managed_by: "wial-platform" },
  });
}

export async function archivePaymentType(productId: string): Promise<void> {
  const stripe = await getStripeClient();
  if (!stripe) {
    throw new PaymentsError("stripe-not-configured");
  }
  await stripe.products.update(productId, { active: false });
}

export async function createCheckoutSession(input: {
  priceId: string;
  appUrl: string;
  user: UserProfile | null;
}): Promise<string> {
  const stripe = await getStripeClient();
  if (!stripe) {
    throw new PaymentsError("stripe-not-configured");
  }
  const price = await stripe.prices
    .retrieve(input.priceId, { expand: ["product"] })
    .catch(() => null);
  if (!price || !price.active || price.type !== "one_time" || !activeProduct(price.product)) {
    throw new PaymentsError("unknown-price");
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: input.priceId, quantity: 1 }],
    customer_email: input.user?.email || undefined,
    success_url: `${input.appUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.appUrl}/pay?cancelled=1`,
    billing_address_collection: "auto",
    metadata: {
      source: "pay",
      userId: input.user?.id ?? "",
      userName: input.user?.name ?? "",
      chapterId: input.user?.chapterId ?? "",
    },
  });
  if (!session.url) {
    throw new PaymentsError("checkout-failed");
  }
  return session.url;
}

type StripePaymentRow = {
  id: string;
  stripe_session_id: string;
  product_name: string;
  amount_total: number;
  currency: string;
  payer_email: string | null;
  payer_name: string | null;
  user_id: string | null;
  status: string;
  paid_at: string | null;
};

function mapPaymentRow(row: StripePaymentRow): PaymentRecord {
  return {
    id: row.id,
    stripeSessionId: row.stripe_session_id,
    productName: row.product_name,
    amount: row.amount_total,
    currency: row.currency,
    payerEmail: row.payer_email,
    payerName: row.payer_name,
    userId: row.user_id,
    status: row.status,
    paidAt: row.paid_at,
  };
}

/**
 * Verify a Checkout Session with Stripe and record it (idempotently) in
 * `stripe_payments`. Returns null when the session is not paid.
 */
export async function recordCheckoutSession(sessionId: string): Promise<PaymentRecord | null> {
  const stripe = await getStripeClient();
  if (!stripe) {
    return null;
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });
  if (session.payment_status !== "paid") {
    return null;
  }
  const line = session.line_items?.data[0];
  const price = line?.price ?? null;
  const product = price ? activeProduct(price.product) : null;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const record: PaymentRecord = {
    id: null,
    stripeSessionId: session.id,
    productName: product?.name ?? line?.description ?? "Payment to WIAL",
    amount: session.amount_total ?? 0,
    currency: session.currency ?? price?.currency ?? "usd",
    payerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    payerName: session.customer_details?.name ?? null,
    userId: session.metadata?.userId || null,
    status: "paid",
    paidAt: new Date(session.created * 1000).toISOString(),
  };

  const client = createServiceRoleSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from("stripe_payments")
      .upsert(
        {
          stripe_session_id: record.stripeSessionId,
          stripe_payment_intent_id: paymentIntent,
          stripe_price_id: price?.id ?? null,
          stripe_product_id: product?.id ?? null,
          product_name: record.productName,
          amount_total: record.amount,
          currency: record.currency,
          payer_email: record.payerEmail,
          payer_name: record.payerName,
          user_id: record.userId,
          chapter_id: session.metadata?.chapterId || null,
          status: record.status,
          metadata: session.metadata ?? {},
          paid_at: record.paidAt,
        },
        { onConflict: "stripe_session_id" },
      )
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("Could not record the Stripe payment:", error.message);
    } else if (data) {
      record.id = data.id;
    }
  }
  return record;
}

export async function listRecentPayments(limit = 25): Promise<PaymentRecord[]> {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return [];
  }
  const { data, error } = await client
    .from("stripe_payments")
    .select(
      "id, stripe_session_id, product_name, amount_total, currency, payer_email, payer_name, user_id, status, paid_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) {
    return [];
  }
  return (data as StripePaymentRow[]).map(mapPaymentRow);
}
