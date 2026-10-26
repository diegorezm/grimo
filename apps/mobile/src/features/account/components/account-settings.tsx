import {
  deleteAccount,
  errorMessage,
  exportFileName,
  type Me,
  useBlockedReaders,
  useExportData,
  useSetBlocked,
} from "@grimo/client";
import { deleteConfirmationMatches } from "@grimo/core";
import { useQuery } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { LegalLinks } from "@/features/legal";
import { useAppCache, useAuthClient } from "@/providers/app-providers";

/**
 * "Conta e privacidade": copy of the data, blocked readers, legal documents and account
 * deletion (App Store guideline 5.1.1(v): deleting must be possible inside the app).
 */
export function AccountSettings({ me }: { me: Me }) {
  return (
    <>
      <Section
        title="Baixar meus dados"
        text="Uma cópia de tudo o que o Grimo guarda sobre você, em um arquivo JSON."
      >
        <ExportButton username={me.username} />
      </Section>
      <Section title="Leitores bloqueados" text="Quem você bloqueia não vê nem interage com você.">
        <BlockedList />
      </Section>
      <Section title="Documentos" text="O que combinamos e como cuidamos dos seus dados.">
        <LegalLinks />
      </Section>
      <Section
        title="Excluir conta"
        text="Apaga sua conta e tudo o que você publicou, de forma definitiva. Seu @ fica livre."
      >
        <DeleteAccount username={me.username} />
      </Section>
    </>
  );
}

function Section({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <Card>
      <Text variant="heading">{title}</Text>
      <Text color="textMuted">{text}</Text>
      {children}
    </Card>
  );
}

function ExportButton({ username }: { username: string }) {
  const exportData = useExportData();

  function share() {
    exportData.mutate(undefined, {
      onSuccess: async (data) => {
        const file = new File(Paths.cache, exportFileName(username));
        if (file.exists) file.delete();
        file.create();
        file.write(JSON.stringify(data, null, 2));
        await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
      },
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        title={exportData.isPending ? "Preparando…" : "Baixar meus dados"}
        disabled={exportData.isPending}
        onPress={share}
      />
      {exportData.error && <Text color="danger">{errorMessage(exportData.error)}</Text>}
    </>
  );
}

function BlockedList() {
  const blocked = useBlockedReaders();
  const setBlocked = useSetBlocked();
  const items = blocked.data?.items ?? [];
  if (blocked.data && items.length === 0) {
    return <Text color="textMuted">Você não bloqueou ninguém.</Text>;
  }
  return (
    <View style={styles.list}>
      {items.map((reader) => (
        <View key={reader.id} style={styles.row}>
          <Text style={styles.flex} numberOfLines={1}>
            {reader.name}{" "}
            <Text variant="small" color="textMuted">
              @{reader.username}
            </Text>
          </Text>
          <Button
            variant="ghost"
            title="Desbloquear"
            onPress={() => setBlocked.mutate({ userId: reader.id, block: false })}
          />
        </View>
      ))}
    </View>
  );
}

function DeleteAccount({ username }: { username: string }) {
  const authClient = useAuthClient();
  const appCache = useAppCache();
  const hasPassword = useQuery({
    queryKey: ["auth", "accounts"],
    queryFn: async () => {
      const { data } = await authClient.listAccounts();
      return (data ?? []).some((account) => account.providerId === "credential");
    },
    staleTime: 60_000,
  });
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!deleteConfirmationMatches(typed, username)) {
      return setError(`Digite @${username} para confirmar.`);
    }
    if (hasPassword.data && !password) return setError("Digite sua senha.");
    setPending(true);
    setError(null);
    const outcome = await deleteAccount(authClient, hasPassword.data ? password : undefined);
    if (outcome.status === "error") {
      setPending(false);
      return setError(outcome.message);
    }
    // The session is gone: the root layout goes back to sign-in.
    await appCache.clearForSignOut();
    router.dismissAll();
  }

  return (
    <View style={styles.list}>
      <Text variant="small">Para confirmar, digite @{username}</Text>
      <Input
        value={typed}
        onChangeText={setTyped}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={`@${username}`}
      />
      {hasPassword.data && (
        <Input
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Sua senha"
          autoComplete="current-password"
        />
      )}
      {error && <Text color="danger">{error}</Text>}
      <Button
        variant="secondary"
        title={pending ? "Excluindo…" : "Excluir minha conta"}
        disabled={pending || hasPassword.isPending}
        onPress={() => void remove()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing[2] },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  flex: { flex: 1 },
});
