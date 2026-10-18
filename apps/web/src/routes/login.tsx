import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/features/auth";

export const Route = createFileRoute("/login")({
  component: () => (
    <div className="grid min-h-dvh place-items-center px-4">
      <AuthForm />
    </div>
  ),
});
