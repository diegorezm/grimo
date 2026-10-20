import { useMe } from "@grimo/client";
import { router } from "expo-router";
import { Button, Screen, Text } from "@/components/ui";
import { AccountSettings } from "@/features/account";

/** Account and privacy: download data, blocked readers, legal documents, delete account. */
export default function AccountScreen() {
  const me = useMe();
  return (
    <Screen>
      <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
      <Text variant="display">Conta e privacidade</Text>
      {me.data && <AccountSettings me={me.data} />}
    </Screen>
  );
}
