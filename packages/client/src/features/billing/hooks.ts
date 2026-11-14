import { api } from "@grimo/backend";
import type { CheckoutRequest } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery } from "../../lib/convex-cache";
import { useConvexCache } from "../../lib/provider";

export type BillingStatus = FunctionReturnType<typeof api.billing.status>;

/** The reader's plan and the shop items they own. Live: the webhook updates it within seconds. */
export function billingStatusQuery() {
  return convexQuery(api.billing.status, {}, "required");
}

export function useBillingStatus() {
  return useQuery(billingStatusQuery());
}

/**
 * Starts a Stripe Checkout and resolves with its URL; the app sends the reader there (the plan
 * and purchases only change when Stripe's webhook arrives, never from the client).
 */
export function useStartCheckout() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (request: CheckoutRequest) => convex.action(api.billing.startCheckout, { request }),
  });
}

/** Opens Stripe's Customer Portal (card, invoices, cancel); resolves with its URL. */
export function useOpenBillingPortal() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: () => convex.action(api.billing.openPortal, {}),
  });
}
