import { createFileRoute } from "@tanstack/react-router";
import { ResetPassword } from "@/features/auth";

/** Opened from the reset email: Better Auth sends `?token=…` (or `?error=INVALID_TOKEN`). */
export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: (search: Record<string, unknown>): { token?: string; error?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, error } = Route.useSearch();
  return <ResetPassword token={token} error={error} />;
}
