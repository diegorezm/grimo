import type { ReportTarget } from "@grimo/core";
import { router } from "expo-router";
import { Alert } from "react-native";

/** Opens the report sheet for a post, comment or reader. */
export const openReport = (target: ReportTarget, targetId: string) =>
  router.push({ pathname: "/report", params: { target, id: targetId } });

/**
 * "⋯" on someone else's post: report it, or block its author (confirmed first). Unblocking is
 * in "Conta e privacidade".
 */
export function showPostActions({
  postId,
  author,
  block,
}: {
  postId: string;
  author: { id: string; name: string };
  block: (userId: string) => void;
}) {
  Alert.alert(author.name, undefined, [
    { text: "Denunciar publicação", onPress: () => openReport("post", postId) },
    {
      text: `Bloquear ${author.name}`,
      style: "destructive",
      onPress: () =>
        Alert.alert(
          `Bloquear ${author.name}?`,
          "Vocês deixam de se seguir e não verão nem poderão interagir com o que o outro publica. Dá para desbloquear em Conta e privacidade.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Bloquear", style: "destructive", onPress: () => block(author.id) },
          ],
        ),
    },
    { text: "Cancelar", style: "cancel" },
  ]);
}
