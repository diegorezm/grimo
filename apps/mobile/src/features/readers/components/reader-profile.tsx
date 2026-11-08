import { type ReaderPage, useMe, useReader, useSetBlocked } from "@grimo/client";
import { Redirect, router } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { showReaderActions } from "@/features/moderation";
import { ProfileHeader, ProfileReadingNow, ProfileTabs, RoundButton } from "@/features/profile";
import { useTheme } from "@/hooks/use-theme";
import { FollowButton } from "./follow-button";

/** Another reader's page: follow, what they're reading, their favorites, lists and activity. */
export function ReaderProfile({ username }: { username: string }) {
  const theme = useTheme();
  const reader = useReader(username);
  const me = useMe().data;

  if (reader.isError) {
    return (
      <Screen>
        <Text color="textMuted">Não encontramos esse leitor.</Text>
        <Button variant="secondary" title="Voltar" onPress={() => router.back()} />
      </Screen>
    );
  }
  if (!reader.data) {
    return (
      <Screen>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }
  // Your own page lives in the Perfil tab (photo, settings, monthly card).
  if (me && reader.data.profile.id === me.id) return <Redirect href="/profile" />;
  return <Page page={reader.data} username={username} />;
}

function Page({ page, username }: { page: ReaderPage; username: string }) {
  const { profile, isFollowing, followsYou, blockedByMe } = page;
  const setBlocked = useSetBlocked();
  const openConnections = (kind: "followers" | "following") =>
    router.push({ pathname: "/u/[username]/[kind]", params: { username, kind } });

  return (
    <Screen>
      <ProfileHeader
        profile={profile}
        onPressCount={openConnections}
        corner={
          <View style={styles.corner}>
            <RoundButton label="Voltar" glyph="‹" onPress={() => router.back()} />
            <RoundButton
              label="Denunciar ou bloquear"
              glyph="⋯"
              onPress={() =>
                showReaderActions({
                  reader: profile,
                  blockedByMe,
                  setBlocked: (block) => setBlocked.mutate({ userId: profile.id, block }),
                })
              }
            />
          </View>
        }
        actions={
          blockedByMe ? null : (
            <FollowButton userId={profile.id} isFollowing={isFollowing} followsYou={followsYou} />
          )
        }
      />
      {followsYou && !blockedByMe && (
        <Text variant="label" color="textMuted">
          segue você
        </Text>
      )}

      {blockedByMe ? (
        <>
          <Text color="textMuted" style={styles.center}>
            Você bloqueou {profile.name}. Vocês não veem o que o outro publica.
          </Text>
          <Button
            variant="secondary"
            title="Desbloquear"
            onPress={() => setBlocked.mutate({ userId: profile.id, block: false })}
          />
        </>
      ) : (
        <>
          <ProfileReadingNow page={page} />
          <ProfileTabs page={page} username={username} isMe={false} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  corner: { flexDirection: "row", gap: spacing[2] },
  center: { textAlign: "center" },
});
