import { useInstance } from "@grimo/client";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthClient, useClearCache } from "@/providers/app-providers";
import { ServerPicker } from "./server-picker";

/** On success the session changes and the root layout swaps to the tabs. */
export function SignInForm() {
  const authClient = useAuthClient();
  const clearCache = useClearCache();
  const instance = useInstance();
  const dark = useColorScheme() === "dark";
  const [chosenMode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });

  // Personal instance without an account yet → this form creates the owner account.
  const isSetup = instance.data?.mode === "personal" && instance.data.registrationOpen;
  const canSignUp = instance.data?.registrationOpen ?? false;
  const mode = isSetup ? "sign-up" : canSignUp ? chosenMode : "sign-in";

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
    await clearCache();
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
      <Text variant="display">{instance.data?.name ?? "Grimo"}</Text>
      <Text color="textMuted">
        {isSetup
          ? "Crie a sua conta. Este Grimo é só seu: o cadastro fecha depois dela."
          : "O que cada livro deixou em você."}
      </Text>
      <ServerPicker />
      {instance.isError && <Text color="danger">Não foi possível conectar a este servidor.</Text>}
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
      {canSignUp && !isSetup && (
        <Button
          variant="ghost"
          title={mode === "sign-in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing[2] },
  logo: { width: 72, height: 72 },
});
