import { type AgreementInput, errorMessage, useAcceptLegal, useMe } from "@grimo/client";
import { firstIssue, legalAcceptanceSchema, PRIVACY_VERSION, TERMS_VERSION } from "@grimo/core";
import { useState } from "react";
import { Button, Card, Text } from "@/components/ui";
import { AgreementFields } from "./agreement-fields";
import { legalSource } from "./legal-links";
import { UnderageNotice } from "./underage-notice";

/**
 * Shown before the tabs when the Terms or the Privacy Policy changed (or the account predates
 * them, then the age is asked too). Accepting closes it: the root layout swaps to the tabs.
 */
export function LegalAccept() {
  const legal = useMe().data?.legal;
  const accept = useAcceptLegal(legalSource);
  const [value, setValue] = useState<AgreementInput>({ accepted: false });
  const [error, setError] = useState<string | null>(null);

  if (legal?.underage) return <UnderageNotice />;
  const askAge = legal?.needsAge ?? false;

  function submit() {
    const input = legalAcceptanceSchema.safeParse({
      ...value,
      birthDate: askAge ? (value.birthDate ?? "") : undefined,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    });
    if (!input.success) return setError(firstIssue(input.error));
    setError(null);
    accept.mutate(value, { onError: (failure) => setError(errorMessage(failure)) });
  }

  return (
    <Card>
      <Text variant="display">Atualizamos nossos termos</Text>
      <Text color="textMuted">
        Para continuar usando o Grimo, leia e aceite os Termos de Uso e a Política de Privacidade.
        {askAge ? " Também precisamos confirmar sua idade." : ""}
      </Text>
      <AgreementFields value={value} onChange={setValue} askAge={askAge} />
      {error && <Text color="danger">{error}</Text>}
      <Button
        title={accept.isPending ? "Salvando…" : "Aceitar e continuar"}
        onPress={submit}
        disabled={accept.isPending}
      />
    </Card>
  );
}
