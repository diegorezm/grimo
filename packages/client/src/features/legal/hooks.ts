import { api } from "@grimo/backend";
import { PRIVACY_VERSION, TERMS_VERSION } from "@grimo/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { useConvexCache } from "../../lib/provider";
import { meQuery } from "../profiles/hooks";

/** Where the reader agreed (stored as evidence with the acceptance). */
export type LegalSource = "web" | "ios" | "android";

/** What the onboarding / the "termos atualizados" dialog collects. */
export interface AgreementInput {
  accepted: boolean;
  /** `YYYY-MM-DD`; only when the age isn't confirmed yet (`me.legal.needsAge`). */
  birthDate?: string;
}

export type AcceptanceResult = FunctionReturnType<typeof api.legal.accept>;

/** The args every acceptance sends: the versions this build shows, and where. */
export const agreementArgs = (input: AgreementInput, source: LegalSource) => ({
  accepted: input.accepted,
  birthDate: input.birthDate || undefined,
  termsVersion: TERMS_VERSION,
  privacyVersion: PRIVACY_VERSION,
  source,
});

/** Applies an acceptance result to the cached `me` (the gate closes, or shows "under 16"). */
export function applyAcceptance<
  T extends { legal: { needsAcceptance: boolean; needsAge: boolean; underage: boolean } },
>(me: T, result: AcceptanceResult): T {
  return result.ok
    ? { ...me, legal: { needsAcceptance: false, needsAge: false, underage: false } }
    : { ...me, legal: { ...me.legal, underage: true } };
}

/** Agrees to the current Terms and Privacy Policy (and declares the age when asked). */
export function useAcceptLegal(source: LegalSource) {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AgreementInput) =>
      convex.mutation(api.legal.accept, agreementArgs(input, source)),
    onSuccess: (result) =>
      queryClient.setQueryData(meQuery().queryKey, (me) => (me ? applyAcceptance(me, result) : me)),
  });
}

export type DataExport = FunctionReturnType<typeof api.account.exportData>;

/** Everything Grimo keeps about the reader, fetched once (not kept in the cache). */
export function useExportData() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (): Promise<DataExport> => convex.query(api.account.exportData, {}),
  });
}

/** File name for the export: `grimo-<username>-<date>.json`. */
export const exportFileName = (username: string, now = new Date()) =>
  `grimo-${username}-${now.toISOString().slice(0, 10)}.json`;
