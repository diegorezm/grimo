import { billingStatusQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { PlanSettings } from "@/features/billing";

/** Plan and shop: the Grimo Plus subscription and one-off items, paid through Stripe. */
export const Route = createFileRoute("/_app/settings/plan")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(billingStatusQuery());
  },
  component: () => (
    <Screen back="Voltar" title="Plano e lojinha">
      <div className="mx-auto w-full max-w-2xl">
        <PlanSettings />
      </div>
    </Screen>
  ),
});
