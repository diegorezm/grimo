import { createFileRoute } from "@tanstack/react-router";
import { DeleteAccountInfoPage } from "@/features/legal";

/** How to delete an account (the URL the app stores ask for). Public. */
export const Route = createFileRoute("/excluir-conta")({
  staticData: {
    seo: {
      title: "Como excluir sua conta",
      description: "Passo a passo para excluir sua conta do Grimo e o que acontece com seus dados.",
      path: "/excluir-conta",
    },
  },
  component: DeleteAccountInfoPage,
});
