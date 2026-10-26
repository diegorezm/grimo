import type { AgreementInput } from "@grimo/client";
import { MIN_AGE } from "@grimo/core";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Birth date (when the age isn't confirmed yet) and the unchecked "I agree" box, with the
 * documents opening in a new tab. Used by the onboarding and by the "termos atualizados" dialog.
 * Validation is the core `legalAcceptanceSchema`, on submit.
 */
export function AgreementFields({
  value,
  onChange,
  askAge,
}: {
  value: AgreementInput;
  onChange: (value: AgreementInput) => void;
  askAge: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {askAge && (
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Data de nascimento
          </span>
          <input
            type="date"
            value={value.birthDate ?? ""}
            max={today()}
            onChange={(e) => onChange({ ...value, birthDate: e.target.value })}
            className="rounded-md border border-border bg-surface px-3.5 py-3 font-mono outline-none focus:border-accent"
          />
          <span className="text-xs text-text-muted">
            O Grimo é para leitores a partir de {MIN_AGE} anos. Guardamos só a confirmação, não a
            data.
          </span>
        </label>
      )}
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          checked={value.accepted}
          onChange={(e) => onChange({ ...value, accepted: e.target.checked })}
          className="mt-1 size-4 shrink-0 accent-accent"
        />
        <span>
          Li e aceito os{" "}
          <a
            href="/termos"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-4"
          >
            Termos de Uso
          </a>{" "}
          e a{" "}
          <a
            href="/privacidade"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-4"
          >
            Política de Privacidade
          </a>
          , e entendo que meu perfil e o que eu publicar ficam públicos.
        </span>
      </label>
    </div>
  );
}
