import { router } from "expo-router";
import { Alert } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { AppearancePicker } from "@/features/profile";
import { useAppCache, useAuthClient } from "@/providers/app-providers";

/** Ajustes: appearance, account and privacy, sign out (out of the profile itself). */
export default function SettingsScreen() {
  const authClient = useAuthClient();
  const appCache = useAppCache();

  function signOut() {
    Alert.alert("Sair da conta?", "Você pode entrar de novo quando quiser.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await appCache.clearForSignOut();
          await authClient.signOut();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
      <Text variant="display">Ajustes</Text>
      <AppearancePicker />
      <Button
        variant="secondary"
        title="Conta e privacidade"
        onPress={() => router.push("/account")}
      />
      <Button variant="ghost" title="Sair" onPress={signOut} />
    </Screen>
  );
}
