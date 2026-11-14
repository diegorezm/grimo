import { isPlanActive, PLUS_PLAN, type PlanInterval, SHOP_ITEMS } from "@grimo/core";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appError } from "./errors";
import { requireViewer } from "./readers";

type Ctx = QueryCtx | MutationCtx;

/** The reader's subscription that counts (one that gives the plan), if any. */
export async function activeSubscription(ctx: Ctx, userId: Id<"users">) {
  const rows = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return rows.find((row) => isPlanActive(row.status)) ?? null;
}

/** Shop items the reader owns (paid and not refunded). */
export async function ownedItems(ctx: Ctx, userId: Id<"users">) {
  const rows = await ctx.db
    .query("purchases")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return [...new Set(rows.filter((row) => row.status === "paid").map((row) => row.itemKey))];
}

export const hasPlus = async (ctx: Ctx, userId: Id<"users">) =>
  (await activeSubscription(ctx, userId)) !== null;

/** The signed-in reader, if on "Grimo Plus"; others get FORBIDDEN. For features the plan unlocks. */
export async function requirePlus(ctx: Ctx): Promise<Doc<"users">> {
  const viewer = await requireViewer(ctx);
  if (!(await hasPlus(ctx, viewer._id))) {
    throw appError("FORBIDDEN", "Esse recurso é do Grimo Plus.");
  }
  return viewer;
}

/** The signed-in reader, if they own the shop item; others get FORBIDDEN. */
export async function requireItem(ctx: Ctx, itemKey: string): Promise<Doc<"users">> {
  const viewer = await requireViewer(ctx);
  if (!(await ownedItems(ctx, viewer._id)).includes(itemKey)) {
    throw appError("FORBIDDEN", "Você ainda não tem esse item.");
  }
  return viewer;
}

/** The subset of a Stripe event the handler reads (so tests can send plain objects). */
export type StripeEventInput = {
  id: string;
  type: string;
  created: number;
  data: { object: Record<string, any> };
};

const asString = (value: unknown) => (typeof value === "string" ? value : null);
/** Stripe expands some fields into objects; the id is what we want either way. */
const idOf = (value: unknown) =>
  typeof value === "string" ? value : asString((value as { id?: unknown } | null)?.id);

async function userFor(ctx: MutationCtx, object: Record<string, any>) {
  const customer = idOf(object.customer);
  if (customer) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", customer))
      .unique();
    if (user) return user;
  }
  const fromMetadata = asString(object.metadata?.userId) ?? asString(object.client_reference_id);
  const id = fromMetadata ? ctx.db.normalizeId("users", fromMetadata) : null;
  return id ? ctx.db.get(id) : null;
}

function intervalOf(subscription: Record<string, any>): PlanInterval | null {
  const lookupKey = subscription.items?.data?.[0]?.price?.lookup_key;
  const match = (Object.entries(PLUS_PLAN.prices) as [PlanInterval, { lookupKey: string }][]).find(
    ([, price]) => price.lookupKey === lookupKey,
  );
  return match?.[0] ?? null;
}

/** The period end: on the subscription item in current API versions, on the subscription before. */
function periodEnd(subscription: Record<string, any>) {
  const seconds =
    subscription.items?.data?.[0]?.current_period_end ?? subscription.current_period_end;
  return typeof seconds === "number" ? seconds * 1000 : null;
}

async function applySubscription(ctx: MutationCtx, event: StripeEventInput) {
  const subscription = event.data.object;
  const user = await userFor(ctx, subscription);
  const stripeSubscriptionId = asString(subscription.id);
  if (!user || !stripeSubscriptionId) return;
  const fields = {
    userId: user._id,
    stripeSubscriptionId,
    status:
      event.type === "customer.subscription.deleted" ? "canceled" : String(subscription.status),
    interval: intervalOf(subscription),
    currentPeriodEnd: periodEnd(subscription),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    eventCreated: event.created,
  };
  const row = await ctx.db
    .query("subscriptions")
    .withIndex("by_stripeSubscriptionId", (q) => q.eq("stripeSubscriptionId", stripeSubscriptionId))
    .unique();
  if (!row) await ctx.db.insert("subscriptions", fields);
  // An older event arriving late must not undo a newer one.
  else if (event.created >= row.eventCreated) await ctx.db.patch(row._id, fields);
}

async function applyCheckout(ctx: MutationCtx, event: StripeEventInput) {
  const session = event.data.object;
  // Subscriptions arrive as `customer.subscription.*`; here only one-off payments matter.
  if (session.mode !== "payment" || session.payment_status !== "paid") return;
  const itemKey = asString(session.metadata?.itemKey);
  const sessionId = asString(session.id);
  if (!itemKey || !sessionId || !(itemKey in SHOP_ITEMS)) return;
  const user = await userFor(ctx, session);
  if (!user) return;
  const known = await ctx.db
    .query("purchases")
    .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", sessionId))
    .unique();
  if (known) return;
  await ctx.db.insert("purchases", {
    userId: user._id,
    itemKey,
    stripeSessionId: sessionId,
    stripePaymentIntentId: idOf(session.payment_intent),
    amount: typeof session.amount_total === "number" ? session.amount_total : 0,
    currency: asString(session.currency) ?? "brl",
    status: "paid",
    createdAt: event.created * 1000,
  });
}

async function applyRefund(ctx: MutationCtx, event: StripeEventInput) {
  const charge = event.data.object;
  const paymentIntent = idOf(charge.payment_intent);
  if (!paymentIntent || charge.refunded !== true) return;
  const purchase = await ctx.db
    .query("purchases")
    .withIndex("by_paymentIntent", (q) => q.eq("stripePaymentIntentId", paymentIntent))
    .unique();
  if (purchase && purchase.status === "paid")
    await ctx.db.patch(purchase._id, { status: "refunded" });
}

/**
 * Applies a verified Stripe event to our tables, once (Stripe repeats deliveries). Returns whether
 * it was new.
 */
export async function applyStripeEvent(ctx: MutationCtx, event: StripeEventInput) {
  const seen = await ctx.db
    .query("stripeEvents")
    .withIndex("by_eventId", (q) => q.eq("eventId", event.id))
    .unique();
  if (seen) return false;
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applySubscription(ctx, event);
      break;
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await applyCheckout(ctx, event);
      break;
    case "charge.refunded":
      await applyRefund(ctx, event);
      break;
  }
  await ctx.db.insert("stripeEvents", {
    eventId: event.id,
    type: event.type,
    processedAt: Date.now(),
  });
  return true;
}
