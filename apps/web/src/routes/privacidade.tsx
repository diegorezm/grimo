import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/features/legal";

/** Privacy Policy (with the cookies / local storage section, `#armazenamento`). Public. */
export const Route = createFileRoute("/privacidade")({
  staticData: {
    seo: {
      title: "Política de Privacidade",
      description:
        "Como o Grimo trata seus dados pessoais, seus direitos pela LGPD e como falar com a gente.",
      path: "/privacidade",
    },
  },
  component: PrivacyPage,
});
