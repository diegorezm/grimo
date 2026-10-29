import { continueWithEmail } from "@grimo/client";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppCache, useAuthClient } from "@/providers/app-providers";
import { ForgotPasswordForm } from "./forgot-password-form";
import { GoogleButton } from "./google-button";

/**
 * Sign in and sign up are the same form: email + password (or Google), validated with the core
 * schemas. An email that isn't an account yet becomes one; the root layout then shows the setup
 * screen (name and @) before the tabs.
 */
export function SignInForm() {
  const authClient = useAuthClient();
  const appCache = useAppCache();
  const dark = useColorScheme() === "dark";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  /** Nothing matched: waiting for the reader to confirm that this email gets a new account. */
  const [newAccountEmail, setNewAccountEmail] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  // Editing a field cancels the confirmation: it was about the email on screen when it appeared.
  const set = (key: keyof typeof form) => (value: string) => {
    setNewAccountEmail(null);
    setForm({ ...form, [key]: value });
  };

  async function submit(confirmedNew = false) {
    setPending(true);
    setError(null);
    const outcome = await continueWithEmail(authClient, form, { confirmedNew });
    setPending(false);
    if (outcome.status === "error") {
      setNewAccountEmail(null);
      return setError(outcome.message);
    }
    if (outcome.status === "confirm-new") return setNewAccountEmail(outcome.email);
    // New session: start from an empty cache so nothing from a previous account shows up.
    await appCache.clearForSignIn();
  }

  if (forgot) return <ForgotPasswordForm onBack={() => setForgot(false)} />;

  return (
    <Card>
      <Image
        accessibilityIgnoresInvertColors
        source={
          dark ? require("@/assets/images/logo-dark.png") : require("@/assets/images/logo.png")
        }
        style={styles.logo}
      />
      <Text variant="display">Bora ler?</Text>
      <Text color="textMuted">
        Entre com seu email. Se ainda não tiver conta, a gente cria na hora.
      </Text>
      <GoogleButton />
      <Text variant="label" color="textMuted" style={styles.divider}>
        ou com email
      </Text>
      <View style={styles.fields}>
        <Input
          placeholder="email@exemplo.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={form.email}
          onChangeText={set("email")}
        />
        <Input
          placeholder="Senha (8+ caracteres se a conta for nova)"
          secureTextEntry
          value={form.password}
          onChangeText={set("password")}
        />
      </View>
      {error && <Text color="danger">{error}</Text>}
      {newAccountEmail ? (
        <View style={styles.fields}>
          <Text>
            Esse email e essa senha não batem com nenhuma conta. Quer criar uma conta nova com{" "}
            {newAccountEmail}?
          </Text>
          <Button
            title={pending ? "Um instante…" : "Criar conta"}
            onPress={() => submit(true)}
            disabled={pending}
          />
          <Button
            title="Corrigir"
            variant="ghost"
            onPress={() => setNewAccountEmail(null)}
            disabled={pending}
          />
        </View>
      ) : (
        <Button
          title={pending ? "Um instante…" : "Continuar"}
          onPress={() => submit()}
          disabled={pending}
        />
      )}
      <Button variant="ghost" title="Esqueci minha senha" onPress={() => setForgot(true)} />
      <Text variant="small" color="textMuted" style={styles.divider}>
        É de graça. Seu email nunca aparece no perfil.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing[2] },
  divider: { textAlign: "center" },
  logo: { width: 72, height: 72 },
});
