import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { CardStudio } from "@/features/stats";

export const Route = createFileRoute("/_app/card")({
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
