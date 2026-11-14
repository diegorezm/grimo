import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { billingEnabled } from "./model/env";
import { verifyWebhook } from "./model/stripe";

const http = httpRouter();

// Better Auth endpoints at <CONVEX_SITE_URL>/api/auth/*. CORS for the web app (SITE_URL).
authComponent.registerRoutes(http, createAuth, { cors: true });

/**
 * Stripe webhook (<CONVEX_SITE_URL>/stripe/webhook): the only way plans and purchases change.
 * The signature is checked on the raw body; anything unsigned is refused. Locally, forward with
 * `stripe listen --forward-to <CONVEX_SITE_URL>/stripe/webhook`.
 */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!billingEnabled()) return new Response("Payments are off", { status: 503 });
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });
    let event: Awaited<ReturnType<typeof verifyWebhook>>;
    try {
      event = await verifyWebhook(await request.text(), signature);
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }
    // A failure here answers 500 so Stripe retries the delivery.
    await ctx.runMutation(internal.billing.applyEvent, {
      id: event.id,
      type: event.type,
      created: event.created,
      object: event.data.object,
    });
    return new Response(null, { status: 200 });
  }),
});

export default http;
