import { useMe } from "@grimo/client";
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
      {me.data && <ProfileHeader profile={me.data} />}
      <YearStats />
      <Text variant="heading">Resumo do mês</Text>
      <MonthlyCard />
      <AppearancePicker />
      <Button variant="ghost" title="Sair" onPress={signOut} />
    </Screen>
  );
}
