import { useMe } from "@grimo/client";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Card, Text } from "@/components/ui";
import { useAuthClient } from "@/providers/app-providers";

/**
 * Shown while the reader's email is not verified: comment, post, like and follow stay locked
 * (`me.needsEmailVerification`). Offers to send the link again.
 */
export function VerifyEmailBanner() {
  const authClient = useAuthClient();
  const needs = useMe().data?.needsEmailVerification ?? false;
  const email = authClient.useSession().data?.user.email;
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!needs || !email) return null;

  async function resend() {
    setState("sending");
    // The link opens in the browser, on the web app; the app picks the verification up from `me`.
    const { error } = await authClient.sendVerificationEmail({ email: email as string });
    setState(error ? "error" : "sent");
  }

  return (
    <Card>
      <Text variant="title">Confirme seu email</Text>
      <Text color="textMuted">
        Enviamos um link para {email}. Até lá você não pode comentar, curtir nem seguir leitores.
      </Text>
      {state === "sent" ? (
        <Text variant="label" color="textMuted" style={styles.sent}>
          Link enviado
        </Text>
      ) : (
        <Button
          variant="secondary"
          title={
            state === "sending"
              ? "Enviando…"
              : state === "error"
                ? "Tentar de novo"
                : "Reenviar link"
          }
          disabled={state === "sending"}
          onPress={resend}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({ sent: { textAlign: "center" } });
