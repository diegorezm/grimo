import { deleteAccount } from "@grimo/client";
import { MIN_AGE, UNDERAGE_MESSAGE } from "@grimo/core";
import { useState } from "react";
import { Button, Card, Text } from "@/components/ui";
import { useAppCache, useAuthClient } from "@/providers/app-providers";

/**
 * An account that declared being under 16 can't use Grimo, only leave. Deleting erases the
 * email too (the account was just created, so no password is needed).
 */
export function UnderageNotice() {
  const authClient = useAuthClient();
  const appCache = useAppCache();
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
    await appCache.clearForSignOut();
  }

  return (
    <Card>
      <Text variant="display">Ainda não dá</Text>
      <Text color="textMuted">
        {UNDERAGE_MESSAGE} A lei pede que redes sociais protejam leitores mais novos, então não
        podemos abrir sua conta agora. Volte quando fizer {MIN_AGE}: vamos guardar uma estante para
        você.
      </Text>
      {error && <Text color="danger">{error}</Text>}
      <Button title="Apagar meus dados e sair" disabled={busy} onPress={() => void leave(true)} />
      <Button variant="ghost" title="Só sair" disabled={busy} onPress={() => void leave(false)} />
    </Card>
  );
}
