import { PLUS_PLAN } from "@grimo/core";
import { describe, expect, it } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const NOW = 1_800_000_000;

const subscriptionEvent = (
  id: string,
  customer: string,
  fields: Record<string, unknown> = {},
  created = NOW,
  type = "customer.subscription.updated",
) => ({
  id,
  type,
  created,
  object: {
    id: "sub_1",
    customer,
    status: "active",
    cancel_at_period_end: false,
    items: {
      data: [
        {
          price: { lookup_key: PLUS_PLAN.prices.yearly.lookupKey },
          current_period_end: NOW + 3600,
        },
      ],
    },
    ...fields,
  },
});

async function readerWithCustomer(
  t: ReturnType<typeof newTest>,
  username: string,
  customer: string,
) {
  const r = await reader(t, username);
  await t.run((ctx) => ctx.db.patch(r.id, { stripeCustomerId: customer }));
  return r;
}

describe("billing webhook", () => {
  it("gives the plan on an active subscription and takes it back when it ends", async () => {
    const t = newTest();
    const { as } = await readerWithCustomer(t, "rafa", "cus_rafa");

    await t.mutation(internal.billing.applyEvent, subscriptionEvent("evt_1", "cus_rafa"));
    const plus = await as.query(api.billing.status, {});
    expect(plus.plan).toBe("plus");
    expect(plus.subscription?.interval).toBe("yearly");
    expect(plus.subscription?.currentPeriodEnd).toBe((NOW + 3600) * 1000);

    await t.mutation(
      internal.billing.applyEvent,
      subscriptionEvent("evt_2", "cus_rafa", {}, NOW + 10, "customer.subscription.deleted"),
    );
    const free = await as.query(api.billing.status, {});
    expect(free.plan).toBe("free");
  });

  it("applies each event once and ignores late, older ones", async () => {
    const t = newTest();
    const { as } = await readerWithCustomer(t, "bia", "cus_bia");

    expect(
      await t.mutation(
        internal.billing.applyEvent,
        subscriptionEvent("evt_a", "cus_bia", {}, NOW + 20),
      ),
    ).toBe(true);
    expect(
      await t.mutation(
        internal.billing.applyEvent,
        subscriptionEvent("evt_a", "cus_bia", {}, NOW + 20),
      ),
    ).toBe(false);
    // An older "canceled" arriving after a newer "active" must not win.
    await t.mutation(
      internal.billing.applyEvent,
      subscriptionEvent("evt_b", "cus_bia", { status: "canceled" }, NOW),
    );
    expect((await as.query(api.billing.status, {})).plan).toBe("plus");
  });

  it("flags a cancellation scheduled for the period end", async () => {
    const t = newTest();
    const { as } = await readerWithCustomer(t, "caio", "cus_caio");
    await t.mutation(
      internal.billing.applyEvent,
      subscriptionEvent("evt_c", "cus_caio", { cancel_at_period_end: true }),
    );
    const status = await as.query(api.billing.status, {});
    expect(status.plan).toBe("plus");
    expect(status.subscription?.cancelAtPeriodEnd).toBe(true);
  });

  it("records a paid shop item, once, and takes it back on refund", async () => {
    const t = newTest();
    const { as } = await readerWithCustomer(t, "lu", "cus_lu");
    const session = {
      id: "cs_1",
      customer: "cus_lu",
      mode: "payment",
      payment_status: "paid",
      amount_total: 990,
      currency: "brl",
      payment_intent: "pi_1",
      metadata: { itemKey: "estante-exemplo" },
    };
    const paid = { id: "evt_p", type: "checkout.session.completed", created: NOW, object: session };
    await t.mutation(internal.billing.applyEvent, paid);
    // Same purchase through another event (e.g. async payment succeeded): no duplicate.
    await t.mutation(internal.billing.applyEvent, { ...paid, id: "evt_p2" });
    expect((await as.query(api.billing.status, {})).items).toEqual(["estante-exemplo"]);

    await t.mutation(internal.billing.applyEvent, {
      id: "evt_r",
      type: "charge.refunded",
      created: NOW + 5,
      object: { payment_intent: "pi_1", refunded: true },
    });
    expect((await as.query(api.billing.status, {})).items).toEqual([]);
  });

  it("ignores unpaid sessions, unknown items and unknown customers", async () => {
    const t = newTest();
    const { as } = await readerWithCustomer(t, "theo", "cus_theo");
    const base = { id: "cs_x", customer: "cus_theo", mode: "payment", currency: "brl" };
    for (const [id, object] of [
      ["evt_1", { ...base, payment_status: "unpaid", metadata: { itemKey: "estante-exemplo" } }],
      ["evt_2", { ...base, payment_status: "paid", metadata: { itemKey: "inventado" } }],
      [
        "evt_3",
        {
          ...base,
          customer: "cus_ghost",
          payment_status: "paid",
          metadata: { itemKey: "estante-exemplo" },
        },
      ],
    ] as const) {
      await t.mutation(internal.billing.applyEvent, {
        id,
        type: "checkout.session.completed",
        created: NOW,
        object,
      });
    }
    expect((await as.query(api.billing.status, {})).items).toEqual([]);
  });

  it("falls back to the user id in the metadata when the customer isn't linked yet", async () => {
    const t = newTest();
    const { as, id } = await reader(t, "mia");
    await t.mutation(
      internal.billing.applyEvent,
      subscriptionEvent("evt_m", "cus_new", { metadata: { userId: id } }),
    );
    expect((await as.query(api.billing.status, {})).plan).toBe("plus");
  });

  it("reports payments off while Stripe isn't configured", async () => {
    const t = newTest();
    const { as } = await reader(t, "zeca");
    expect((await as.query(api.billing.status, {})).enabled).toBe(false);
    await expect(
      as.action(api.billing.startCheckout, { request: { kind: "plan", interval: "monthly" } }),
    ).rejects.toThrow();
  });
});
