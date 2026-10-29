import { requestPasswordReset } from "@grimo/client";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { SITE_URL } from "@/lib/server";
import { useAuthClient } from "@/providers/app-providers";

/**
 * "Esqueci minha senha": sends the link by email. The link opens the web page that sets the new
 * password (`/redefinir-senha`); then the reader signs in here with it.
 */
export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const authClient = useAuthClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    const outcome = await requestPasswordReset(
      authClient,
      { email },
      `${SITE_URL}/redefinir-senha`,
    );
    setPending(false);
    if (outcome.status === "error") return setError(outcome.message);
    setSent(true);
  }

  return (
    <Card>
      <Text variant="display">{sent ? "Confira seu email" : "Esqueceu a senha?"}</Text>
      {sent ? (
        <Text color="textMuted">
          Se houver uma conta com {email.trim()}, mandamos um link para criar uma senha nova. Ele
          vale por 1 hora. Depois, volte aqui e entre com a senha nova.
        </Text>
      ) : (
        <View style={styles.fields}>
          <Text color="textMuted">Diga seu email e mandamos um link para criar outra.</Text>
          <Input
            placeholder="email@exemplo.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {error && <Text color="danger">{error}</Text>}
          <Button
            title={pending ? "Um instante…" : "Mandar link"}
            onPress={submit}
            disabled={pending}
          />
        </View>
      )}
      <Button variant="ghost" title="‹ Voltar para entrar" onPress={onBack} />
    </Card>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing[2] },
});
