import { useMe } from "@grimo/client";
import { Button, Screen, Text } from "@/components/ui";
import { ProfileHeader } from "@/features/profile";
import { MonthlyCard, YearStats } from "@/features/stats";
import { queryClient } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export default function ProfileScreen() {
  const me = useMe();

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
