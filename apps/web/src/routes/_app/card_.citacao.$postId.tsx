import { postQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { QuoteCardStudio } from "@/features/stats";

export const Route = createFileRoute("/_app/card_/citacao/$postId")({
  loader: ({ context: { queryClient }, params: { postId } }) => {
    void queryClient.prefetchQuery(postQuery(postId));
  },
  component: QuoteCardPage,
});

function QuoteCardPage() {
  const { postId } = Route.useParams();
  return (
    <Screen
      back="Voltar"
      title="Card da citação"
      subtitle="Para os Stories, o WhatsApp ou onde quiser."
    >
      <QuoteCardStudio postId={postId} />
    </Screen>
  );
}
