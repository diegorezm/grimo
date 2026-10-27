import { type ReaderPage, useMe, useReader, useReaderActivity, useSetBlocked } from "@grimo/client";
import { Redirect, router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookTile } from "@/features/books";
import { FeedItem } from "@/features/feed";
import { showReaderActions } from "@/features/moderation";
import { ProfileHeader } from "@/features/profile";
import { YearStats } from "@/features/stats";
import { useTheme } from "@/hooks/use-theme";
import { FollowButton } from "./follow-button";

/** Another reader's page: follow, their year, what they're reading, favorites and activity. */
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
  const { profile, stats, books, isFollowing, followsYou, blockedByMe } = page;
  const setBlocked = useSetBlocked();
  const openConnections = (kind: "followers" | "following") =>
    router.push({ pathname: "/u/[username]/[kind]", params: { username, kind } });

  return (
    <Screen>
      <View style={styles.bar}>
        <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Denunciar ou bloquear"
          hitSlop={10}
          onPress={() =>
            showReaderActions({
              reader: profile,
              blockedByMe,
              setBlocked: (block) => setBlocked.mutate({ userId: profile.id, block }),
            })
          }
        >
          <Text variant="heading" color="textMuted">
            ⋯
          </Text>
        </Pressable>
      </View>

      <ProfileHeader profile={profile} onPressCount={openConnections} />
      {followsYou && !blockedByMe && (
        <Text variant="label" color="textMuted" style={styles.center}>
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
          <FollowButton userId={profile.id} isFollowing={isFollowing} followsYou={followsYou} />
          <YearStats overview={stats} />
          {books.reading.length > 0 && (
            <Shelf title="Lendo agora">
              {books.reading.map(({ entry, book }) => (
                <BookTile key={entry.id} book={book} currentPage={entry.currentPage} />
              ))}
            </Shelf>
          )}
          {books.favorites.length > 0 && (
            <Shelf title="Favoritos">
              {books.favorites.map(({ entry, book }) => (
                <BookTile key={entry.id} book={book} rating={entry.rating} />
              ))}
            </Shelf>
          )}
          <Activity username={username} />
        </>
      )}
    </Screen>
  );
}

function Shelf({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="heading">{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function Activity({ username }: { username: string }) {
  const activity = useReaderActivity(username);
  const items = activity.data?.items ?? [];
  return (
    <View style={styles.section}>
      <Text variant="heading">Atividade</Text>
      {items.map((item) => (
        <FeedItem key={item.id} item={item} />
      ))}
      {!activity.isPending && items.length === 0 && (
        <Text color="textMuted">Nada por aqui ainda.</Text>
      )}
      {activity.hasNextPage && (
        <Button
          variant="secondary"
          title={activity.isFetchingNextPage ? "Carregando…" : "Ver mais"}
          onPress={activity.fetchNextPage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  center: { textAlign: "center" },
  section: { gap: spacing[3] },
  row: { gap: spacing[3] },
});
