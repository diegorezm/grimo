import { BILLING_CURRENCY } from "@grimo/core";
import Stripe from "stripe";
import { env } from "./env";
import { appError } from "./errors";

/**
 * Stripe client for Convex's default runtime (no Node): requests go through `fetch`, and webhook
 * signatures are checked with Web Crypto.
 */
export function stripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw appError("INVALID", "Os pagamentos ainda não estão disponíveis.");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });
}

/** Verifies the `Stripe-Signature` of a webhook body and returns the event. Throws if forged. */
export async function verifyWebhook(body: string, signature: string) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET)
    throw new Error("Stripe not configured");
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });
  return stripe.webhooks.constructEventAsync(
    body,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
    undefined,
    Stripe.createSubtleCryptoProvider(),
  );
}

type PriceSpec = {
  lookupKey: string;
  name: string;
  amount: number;
  /** Set for subscriptions. */
  interval?: "month" | "year";
};

/**
 * The Stripe price for a catalog entry, created on first use. Keyed by `lookupKey`, so the
 * catalog in `@grimo/core` is the only place to describe what we sell (nothing to configure in
 * the dashboard, in test or in production).
 */
export async function ensurePrice(stripe: Stripe, spec: PriceSpec) {
  const found = await stripe.prices.list({ lookup_keys: [spec.lookupKey], active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const price = await stripe.prices.create({
    lookup_key: spec.lookupKey,
    currency: BILLING_CURRENCY,
    unit_amount: spec.amount,
    ...(spec.interval ? { recurring: { interval: spec.interval } } : {}),
    product_data: { name: spec.name },
  });
  return price.id;
}

/**
 * The Customer Portal needs a saved configuration; the dashboard would ask for one, so make it
 * here when the account has none (manage the payment method, see invoices, cancel).
 */
export async function ensurePortalConfiguration(stripe: Stripe) {
  const existing = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
  if (existing.data[0]) return;
  await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Grimo" },
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
}
