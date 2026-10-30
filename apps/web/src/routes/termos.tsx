import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/features/legal";

/** Terms of Use. Public. */
export const Route = createFileRoute("/termos")({
  staticData: {
    seo: {
      title: "Termos de Uso",
      description:
        "As regras de uso do Grimo, o diário de leituras: conta, conteúdo e convivência.",
      path: "/termos",
    },
  },
  component: TermsPage,
});
