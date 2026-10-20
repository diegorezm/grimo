import { type AgreementInput, errorMessage, useAcceptLegal, useMe } from "@grimo/client";
import { firstIssue, legalAcceptanceSchema, PRIVACY_VERSION, TERMS_VERSION } from "@grimo/core";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { AgreementFields } from "./agreement-fields";
import { UnderageNotice } from "./underage-notice";

/**
 * Over the app, for accounts that finished the onboarding but must agree again: the Terms or
 * the Privacy Policy changed, or the account predates them (then the age is asked too). Readers
 * who declared being under 16 only get the way out.
 */
export function LegalGate() {
  const me = useMe();
  const legal = me.data && !me.data.needsSetup ? me.data.legal : null;
  if (!legal || (!legal.needsAcceptance && !legal.underage)) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-gate-title"
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        {legal.underage ? <UnderageNotice /> : <AcceptForm askAge={legal.needsAge} />}
      </div>
    </div>
  );
}

function AcceptForm({ askAge }: { askAge: boolean }) {
  const accept = useAcceptLegal("web");
  const [value, setValue] = useState<AgreementInput>({ accepted: false });
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
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
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 id="legal-gate-title" className="text-3xl font-medium italic">
          Atualizamos nossos termos
        </h2>
        <p className="text-text-muted">
          Para continuar usando o Grimo, leia e aceite os Termos de Uso e a Política de Privacidade.
          {askAge && " Também precisamos confirmar sua idade."}
        </p>
      </div>
      <AgreementFields value={value} onChange={setValue} askAge={askAge} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={accept.isPending} className="self-start py-3">
        {accept.isPending ? "Salvando…" : "Aceitar e continuar"}
      </Button>
    </form>
  );
}
