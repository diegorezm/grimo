import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/features/legal";

/** Terms of Use. Public. */
export const Route = createFileRoute("/termos")({
  component: TermsPage,
});
