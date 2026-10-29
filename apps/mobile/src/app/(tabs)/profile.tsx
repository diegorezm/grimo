import { useMe } from "@grimo/client";
import { router } from "expo-router";
import { Button, Screen, Text } from "@/components/ui";
import { AppearancePicker, ProfileHeader } from "@/features/profile";
import { MonthlyCard, YearStats } from "@/features/stats";
import { useAppCache, useAuthClient } from "@/providers/app-providers";

export default function ProfileScreen() {
  const me = useMe();
  const authClient = useAuthClient();
  const appCache = useAppCache();

  async function signOut() {
    await appCache.clearForSignOut();
    await authClient.signOut();
  }

  return (
    <Screen>
      {me.data && (
        <ProfileHeader
          profile={me.data}
          editable
          onPressCount={(kind) =>
            router.push({
              pathname: "/u/[username]/[kind]",
              params: { username: me.data!.username, kind },
            })
          }
        />
      )}
      <Button
        variant="secondary"
        title="Editar perfil"
        onPress={() => router.push("/profile-edit")}
      />
      <YearStats />
      <Text variant="heading">Card do mês</Text>
      <MonthlyCard />
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
