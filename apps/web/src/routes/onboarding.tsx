import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingFlow } from "@/features/onboarding";
import { sessionQuery } from "@/lib/api";

/** First run after sign-up: focused, outside the app shell. */
export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);
    if (!session) throw redirect({ to: "/login" });
  },
  component: OnboardingFlow,
});
