import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/features/legal";

/** Privacy Policy (with the cookies / local storage section, `#armazenamento`). Public. */
export const Route = createFileRoute("/privacidade")({
  component: PrivacyPage,
});
