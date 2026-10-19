import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppCache, useAuthClient } from "@/providers/app-providers";

/** On success the session changes and the root layout swaps to the tabs. */
export function SignInForm() {
  const authClient = useAuthClient();
  const appCache = useAppCache();
  const dark = useColorScheme() === "dark";
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });

  async function submit() {
    setPending(true);
    setError(null);
    const { error } =
      mode === "sign-in"
        ? await authClient.signIn.email({ email: form.email, password: form.password })
        : await authClient.signUp.email({
            ...form,
            username: form.username.toLowerCase(),
          });
    setPending(false);
    if (error) return setError(error.message ?? "Algo deu errado");
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
      <Text variant="display">Grimo</Text>
      <Text color="textMuted">O que cada livro deixou em você.</Text>
      <View style={styles.fields}>
        {mode === "sign-up" && (
          <>
            <Input placeholder="Seu nome" value={form.name} onChangeText={set("name")} />
            <Input
              placeholder="usuario"
              autoCapitalize="none"
              value={form.username}
              onChangeText={set("username")}
            />
          </>
        )}
        <Input
          placeholder="email@exemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={set("email")}
        />
        <Input
          placeholder="Senha"
          secureTextEntry
          value={form.password}
          onChangeText={set("password")}
        />
      </View>
      {error && <Text color="danger">{error}</Text>}
      <Button
        title={mode === "sign-in" ? "Entrar" : "Criar conta"}
        onPress={submit}
        disabled={pending}
      />
      <Button
        variant="ghost"
        title={mode === "sign-in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing[2] },
  logo: { width: 72, height: 72 },
});
