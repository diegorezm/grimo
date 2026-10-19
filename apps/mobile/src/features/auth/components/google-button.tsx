import { useAuthProviders } from "@grimo/client";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAppCache, useAuthClient } from "@/providers/app-providers";

/**
 * "Continuar com Google" (system browser + `grimo://` deep link, handled by expoClient). When the
 * deployment has no Google credentials yet, the button stays visible but disabled, with a note.
 */
export function GoogleButton() {
  const theme = useTheme();
  const authClient = useAuthClient();
  const appCache = useAppCache();
  const providers = useAuthProviders();
  const available = providers.data?.google ?? false;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    await appCache.clearForSignIn();
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    setPending(false);
    if (error) setError(error.message ?? "Não foi possível entrar com Google");
  }

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !available || pending }}
        disabled={!available || pending}
        onPress={signIn}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: theme.border,
            backgroundColor: theme.surface,
            opacity: !available ? 0.55 : pressed || pending ? 0.7 : 1,
          },
        ]}
      >
        <Text variant="label" style={styles.mark}>
          G
        </Text>
        <Text variant="label">{pending ? "Abrindo o Google…" : "Continuar com Google"}</Text>
      </Pressable>
      {!available && !providers.isPending && (
        <Text variant="small" color="textMuted" style={styles.center}>
          Entrar com Google não está disponível no momento. Use seu email.
        </Text>
      )}
      {error && (
        <Text variant="small" color="danger" style={styles.center}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
  },
  mark: { fontSize: 16, fontWeight: "700" },
  center: { textAlign: "center" },
});
