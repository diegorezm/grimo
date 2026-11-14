import { checkoutRequestSchema, PLUS_PLAN, SHOP_ITEMS } from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { activeSubscription, applyStripeEvent, hasPlus, ownedItems } from "./model/billing";
import { billingEnabled, env } from "./model/env";
import { appError, parse } from "./model/errors";
import { enforceRateLimit } from "./model/rateLimit";
import { requireViewer } from "./model/readers";
import { ensurePortalConfiguration, ensurePrice, stripeClient } from "./model/stripe";

/**
 * Payments with Stripe: the "Grimo Plus" subscription and the shop's one-off items. Stripe hosts
 * the checkout and the customer portal; our tables only mirror what it tells the webhook
 * (`http.ts` → `applyEvent`), which is the single way plan and purchases change.
 */

/** What the reader has: the plan, its state and the shop items they own. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const subscription = await activeSubscription(ctx, viewer._id);
    return {
      /** False when the deployment has no Stripe keys: the apps hide the buy buttons. */
      enabled: billingEnabled(),
      plan: subscription ? ("plus" as const) : ("free" as const),
      subscription: subscription && {
        status: subscription.status,
        interval: subscription.interval,
        currentPeriodEnd: subscription.currentPeriodEnd,
        /** Cancelled: stays until `currentPeriodEnd`, then goes back to free. */
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      items: await ownedItems(ctx, viewer._id),
    };
  },
});

/** What a checkout needs to know about the reader (read inside the action). */
export const checkoutContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    return {
      userId: viewer._id,
      stripeCustomerId: viewer.stripeCustomerId ?? null,
      hasPlus: await hasPlus(ctx, viewer._id),
      items: await ownedItems(ctx, viewer._id),
    };
  },
});

/** Remembers the reader's Stripe customer; if two clicks raced, the first one wins. */
export const saveCustomer = internalMutation({
  args: { userId: v.id("users"), customerId: v.string() },
  handler: async (ctx, { userId, customerId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw appError("NOT_FOUND", "Leitor não encontrado");
    if (user.stripeCustomerId) return user.stripeCustomerId;
    await ctx.db.patch(userId, { stripeCustomerId: customerId });
    return customerId;
  },
});

const checkoutArgs = v.union(
  v.object({
    kind: v.literal("plan"),
    interval: v.union(v.literal("monthly"), v.literal("yearly")),
  }),
  v.object({ kind: v.literal("item"), key: v.string() }),
);

/** The page the reader comes back to after Stripe (web only for now). */
const returnUrl = (path: string) => `${env.SITE_URL}${path}`;

/** Starts a Stripe Checkout for the plan or a shop item and returns its URL (the web redirects). */
export const startCheckout = action({
  args: { request: checkoutArgs },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const request = parse(checkoutRequestSchema, args.request);
    const stripe = stripeClient();
    const reader = await ctx.runQuery(internal.billing.checkoutContext, {});
    await enforceRateLimit(ctx, "billing", reader.userId);
    if (request.kind === "plan" && reader.hasPlus) {
      throw appError("INVALID", "Você já tem o Grimo Plus. Gerencie a assinatura pelo portal.");
    }
    if (request.kind === "item" && reader.items.includes(request.key)) {
      throw appError("INVALID", "Você já tem esse item.");
    }

    let customerId = reader.stripeCustomerId;
    if (!customerId) {
      const identity = await ctx.auth.getUserIdentity();
      const customer = await stripe.customers.create(
        { email: identity?.email ?? undefined, metadata: { userId: reader.userId } },
        { idempotencyKey: `grimo-customer-${reader.userId}` },
      );
      customerId = await ctx.runMutation(internal.billing.saveCustomer, {
        userId: reader.userId,
        customerId: customer.id,
      });
    }

    const metadata = { userId: reader.userId };
    const common = {
      customer: customerId,
      client_reference_id: reader.userId,
      locale: "pt-BR" as const,
      success_url: returnUrl("/settings/plan?checkout=success"),
      cancel_url: returnUrl("/settings/plan?checkout=cancelled"),
    };
    let session: { url: string | null };
    if (request.kind === "plan") {
      const plan = PLUS_PLAN.prices[request.interval];
      session = await stripe.checkout.sessions.create({
        ...common,
        mode: "subscription",
        line_items: [
          {
            quantity: 1,
            price: await ensurePrice(stripe, {
              lookupKey: plan.lookupKey,
              name: `${PLUS_PLAN.name} (${request.interval === "monthly" ? "mensal" : "anual"})`,
              amount: plan.amount,
              interval: plan.stripeInterval,
            }),
          },
        ],
        subscription_data: { metadata },
      });
    } else {
      const item = SHOP_ITEMS[request.key];
      const itemMetadata = { ...metadata, itemKey: request.key };
      session = await stripe.checkout.sessions.create({
        ...common,
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price: await ensurePrice(stripe, {
              lookupKey: item.lookupKey,
              name: item.name,
              amount: item.amount,
            }),
          },
        ],
        metadata: itemMetadata,
        payment_intent_data: { metadata: itemMetadata },
      });
    }
    if (!session.url) throw appError("INVALID", "Não deu para abrir o pagamento. Tente de novo.");
    return { url: session.url };
  },
});

/** Opens Stripe's Customer Portal (card, invoices, cancel) and returns its URL. */
export const openPortal = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    const stripe = stripeClient();
    const reader = await ctx.runQuery(internal.billing.checkoutContext, {});
    await enforceRateLimit(ctx, "billing", reader.userId);
    if (!reader.stripeCustomerId) throw appError("INVALID", "Você ainda não tem compras.");
    await ensurePortalConfiguration(stripe);
    const session = await stripe.billingPortal.sessions.create({
      customer: reader.stripeCustomerId,
      return_url: returnUrl("/settings/plan"),
    });
    return { url: session.url };
  },
});

/** Applies a verified webhook event (called by the HTTP route in `http.ts`). */
export const applyEvent = internalMutation({
  args: { id: v.string(), type: v.string(), created: v.number(), object: v.any() },
  handler: async (ctx, { object, ...event }) =>
    applyStripeEvent(ctx, { ...event, data: { object } }),
});

/**
 * The reader deleted their account: delete their Stripe customer, which also cancels any
 * subscription, so nobody is charged for an account that is gone. Stripe keeps the invoices it
 * must keep by law; our `purchases` rows stay too, without the reader.
 */
export const closeAccount = internalAction({
  args: { customerId: v.string() },
  handler: async (_ctx, { customerId }) => {
    if (!billingEnabled()) return;
    await stripeClient().customers.del(customerId);
  },
});
