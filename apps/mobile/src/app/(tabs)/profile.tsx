import { useMe } from "@grimo/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Screen, Text } from "@/components/ui";
import { ProfileHeader } from "@/features/profile";
import { MonthlyCard, YearStats } from "@/features/stats";
import { useAuthClient } from "@/providers/app-providers";

export default function ProfileScreen() {
  const me = useMe();
  const authClient = useAuthClient();
  const queryClient = useQueryClient();

  async function signOut() {
    await authClient.signOut();
    queryClient.clear();
  }

  return (
    <Screen>
      {me.data && <ProfileHeader profile={me.data} />}
      <YearStats />
      <Text variant="heading">Resumo do mês</Text>
      <MonthlyCard />
      <Button variant="ghost" title="Sair" onPress={signOut} />
    </Screen>
  );
}
