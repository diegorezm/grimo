import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

/** On success the session changes and the root layout swaps to the tabs. */
export function SignInForm() {
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
    if (error) setError(error.message ?? "Algo deu errado");
  }

  return (
    <Card>
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

const styles = StyleSheet.create({ fields: { gap: spacing[2] } });
