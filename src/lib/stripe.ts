import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.secret_key;

  if (!stripeSecretKey) {
    throw new Error('Missing Stripe secret key');
  }

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: '2026-03-25.dahlia',
  });

  return stripeClient;
}

export function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || process.env.stripe_webhook_secret || '';
}
