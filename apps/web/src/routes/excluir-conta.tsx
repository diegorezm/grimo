import { createFileRoute } from "@tanstack/react-router";
import { DeleteAccountInfoPage } from "@/features/legal";

/** How to delete an account (the URL the app stores ask for). Public. */
export const Route = createFileRoute("/excluir-conta")({
  component: DeleteAccountInfoPage,
});
