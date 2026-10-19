import { continueWithEmail } from "@grimo/client";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppCache, useAuthClient } from "@/providers/app-providers";
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
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });

  async function submit() {
    setPending(true);
    setError(null);
    const outcome = await continueWithEmail(authClient, form);
    setPending(false);
    if (outcome.status === "error") return setError(outcome.message);
    // New session: start from an empty cache so nothing from a previous account shows up.
    await appCache.clearForSignIn();
  }

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
      <Button title={pending ? "Um instante…" : "Continuar"} onPress={submit} disabled={pending} />
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
