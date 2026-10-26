import {
  type AgreementInput,
  errorMessage,
  useCompleteSetup,
  useMe,
  useUsernameAvailable,
} from "@grimo/client";
import {
  firstIssue,
  legalAcceptanceSchema,
  PRIVACY_VERSION,
  setupProfileSchema,
  TERMS_VERSION,
  usernameFromName,
} from "@grimo/core";
import { useDeferredValue, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { AgreementFields, legalSource, UnderageNotice } from "@/features/legal";

/**
 * First screen of a new account: the name (Google's, when it came from there), the @ others
 * use to find you, the birth date (16+) and the acceptance of the Terms and Privacy Policy.
 * Validated with the core schemas; the @ says right away whether it's free. Saving ends the
 * setup and the root layout swaps to the tabs (under 16, this screen shows the way out).
 */
export function ProfileSetup() {
  const me = useMe().data;
  const completeSetup = useCompleteSetup(legalSource);
  const [name, setName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<AgreementInput>({ accepted: false });
  const currentName = name ?? me?.name ?? "";
  // Follows the name until edited (a Google account starts with the @ the server picked).
  const handle =
    username ?? (me?.name && name === null ? me.username : usernameFromName(currentName));
  const checked = useUsernameAvailable(useDeferredValue(handle));
  const taken = checked.data?.valid && !checked.data.available;
  const [error, setError] = useState<string | null>(null);

  if (me?.legal.underage) return <UnderageNotice />;

  function save() {
    const input = setupProfileSchema.safeParse({ name: currentName, username: handle });
    if (!input.success) return setError(firstIssue(input.error));
    if (taken) return setError("Esse @ já tem dono. Que tal outro?");
    const legal = legalAcceptanceSchema.safeParse({
      ...agreement,
      birthDate: agreement.birthDate ?? "",
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    });
    if (!legal.success) return setError(firstIssue(legal.error));
    setError(null);
    completeSetup.mutate(
      { ...input.data, ...agreement },
      { onError: (failure) => setError(errorMessage(failure)) },
    );
  }

  return (
    <Card>
      <Text variant="label" color="accent">
        ✓ Conta criada
      </Text>
      <Text variant="display">Como você quer aparecer por aqui?</Text>
      <Text color="textMuted">
        Seu nome e o @ que os amigos vão usar pra te achar. Dá pra mudar o nome depois.
      </Text>
      <View style={styles.fields}>
        <Input placeholder="Seu nome" value={currentName} onChangeText={setName} />
        <Input
          placeholder="@usuario"
          autoCapitalize="none"
          autoCorrect={false}
          value={handle}
          onChangeText={(value) => setUsername(value.toLowerCase().replace(/^@/, ""))}
        />
        <Text variant="small" color={taken ? "danger" : "textMuted"}>
          {handle.length >= 3 && checked.data
            ? !checked.data.valid
              ? "Use 3 a 30 letras minúsculas, números, ponto ou _"
              : taken
                ? "Esse @ já tem dono"
                : "Disponível ✦"
            : " "}
        </Text>
      </View>
      <AgreementFields value={agreement} onChange={setAgreement} askAge />
      {error && <Text color="danger">{error}</Text>}
      <Button
        title={completeSetup.isPending ? "Salvando…" : "É assim que eu sou"}
        onPress={save}
        disabled={completeSetup.isPending}
      />
    </Card>
  );
}

const styles = StyleSheet.create({ fields: { gap: spacing[2] } });
