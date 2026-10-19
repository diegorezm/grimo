import { meQuery, monthlySummaryQuery } from "@grimo/client";
import { shiftMonth, toMonthKey } from "@grimo/core";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { CardStudio } from "@/features/stats";

export const Route = createFileRoute("/_app/card")({
  loader: ({ context: { queryClient } }) => {
    const month = toMonthKey(new Date());
    void queryClient.prefetchQuery(meQuery());
    void queryClient.prefetchQuery(monthlySummaryQuery(month));
    void queryClient.prefetchQuery(monthlySummaryQuery(shiftMonth(month, -1)));
  },
  component: () => (
    <Screen
      back="Voltar"
      title="Card do mês"
      subtitle="Escolha um modelo e as cores, e compartilhe nos Stories."
    >
      <CardStudio />
    </Screen>
  ),
});
