import { deleteAccount } from "@grimo/client";
import { MIN_AGE, UNDERAGE_MESSAGE } from "@grimo/core";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearCacheForSignOut } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

/**
 * Shown to an account that declared being under 16: it can't use Grimo, only leave. Deleting
 * erases the email too (the account was just created, so no password is needed).
 */
export function UnderageNotice() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leave(remove: boolean) {
    setBusy(true);
    setError(null);
    if (remove) {
      const outcome = await deleteAccount(authClient);
      if (outcome.status === "error") {
        setBusy(false);
        return setError(outcome.message);
      }
    } else {
      await authClient.signOut();
    }
    await clearCacheForSignOut();
    await navigate({ to: "/welcome" });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-3xl font-medium italic">Ainda não dá</h2>
      <p className="text-text-muted">
        {UNDERAGE_MESSAGE} A lei pede que redes sociais protejam leitores mais novos, então não
        podemos abrir sua conta agora. Volte quando fizer {MIN_AGE}: vamos guardar uma estante para
        você.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => void leave(true)}>
          Apagar meus dados e sair
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => void leave(false)}>
          Só sair
        </Button>
      </div>
    </div>
  );
}
