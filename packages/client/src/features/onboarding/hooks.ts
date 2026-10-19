import { api } from "@grimo/backend";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "../../lib/convex-cache";
import { useMe } from "../profiles/hooks";
import { useShelf } from "../shelves/hooks";

/** Which sign-in methods the backend offers (Google needs credentials on the deployment). */
export function authProvidersQuery() {
  return convexQuery(api.auth.providers, {}, "optional");
}

export function useAuthProviders() {
  return useQuery(authProvidersQuery());
}

export type OnboardingStepId = "account" | "book" | "goal" | "follow";

export interface OnboardingStep {
  id: OnboardingStepId;
  label: string;
  done: boolean;
}

/**
 * First steps of a new reader, from real data (not a "seen the tour" flag). The account step
 * starts done, so progress never starts at zero; the list disappears once everything is done.
 */
export function useOnboardingChecklist() {
  const me = useMe();
  const shelf = useShelf();
  if (!me.data || !shelf.data) return null;

  const steps: OnboardingStep[] = [
    { id: "account", label: "Criar sua conta", done: true },
    { id: "book", label: "Adicionar o livro que está lendo", done: shelf.data.items.length > 0 },
    { id: "goal", label: "Definir sua meta do ano", done: me.data.yearlyGoal !== null },
    { id: "follow", label: "Seguir um leitor", done: me.data.following > 0 },
  ];
  const done = steps.filter((step) => step.done).length;
  return {
    steps,
    done,
    total: steps.length,
    percent: Math.round((done / steps.length) * 100),
    complete: done === steps.length,
    next: steps.find((step) => !step.done) ?? null,
  };
}
