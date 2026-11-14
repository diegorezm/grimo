import { z } from "zod";

/**
 * What Grimo sells. Prices live in Stripe, created on demand from this catalog (by `lookupKey`,
 * see `convex/model/stripe.ts`), so there is nothing to set up in the Stripe dashboard. Amounts
 * are in cents of `BILLING_CURRENCY`. Changing an amount means a new `lookupKey` (Stripe prices
 * are immutable), so existing subscribers keep the price they signed up for.
 */
export const BILLING_CURRENCY = "brl";

/** The subscription ("Grimo Plus"). */
export const PLAN_INTERVALS = ["monthly", "yearly"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export const PLUS_PLAN = {
  name: "Grimo Plus",
  /** Placeholder amounts until pricing is decided. */
  prices: {
    monthly: { lookupKey: "grimo_plus_monthly_v1", amount: 1490, stripeInterval: "month" },
    yearly: { lookupKey: "grimo_plus_yearly_v1", amount: 14900, stripeInterval: "year" },
  },
} as const;

/** One-off purchases of the shop ("lojinha"): cosmetics the reader keeps for good. */
export const SHOP_ITEMS = {
  /** Example item, to exercise the flow end to end; replace with the real ones. */
  "estante-exemplo": {
    name: "Estante de exemplo",
    description: "Item de teste da lojinha.",
    lookupKey: "grimo_item_estante_exemplo_v1",
    amount: 990,
  },
} as const;
export type ShopItemKey = keyof typeof SHOP_ITEMS;
export const SHOP_ITEM_KEYS = Object.keys(SHOP_ITEMS) as ShopItemKey[];

/** What a checkout buys: the plan (monthly or yearly) or one shop item. */
export const checkoutRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plan"), interval: z.enum(PLAN_INTERVALS) }),
  z.object({
    kind: z.literal("item"),
    key: z.enum(SHOP_ITEM_KEYS as [ShopItemKey, ...ShopItemKey[]]),
  }),
]);
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/** Subscription states (from Stripe) that give the reader the plan. `past_due` is a grace period. */
export const PLAN_ACTIVE_STATUSES = ["active", "trialing", "past_due"] as const;
export const isPlanActive = (status: string) =>
  (PLAN_ACTIVE_STATUSES as readonly string[]).includes(status);

/** "R$ 14,90" from cents. */
export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: BILLING_CURRENCY.toUpperCase(),
  }).format(cents / 100);
