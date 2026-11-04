import { useReaderLists } from "@grimo/client";
import { bookCountLabel } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";

/** "Listas" on a profile: the reader's curated lists, and "Nova lista" on your own. */
export function ReaderLists({ username, isMe }: { username: string; isMe: boolean }) {
  const lists = useReaderLists(username).data?.items ?? [];
  if (lists.length === 0 && !isMe) return null;

  return (
    <View style={styles.section}>
      <Text variant="heading">Listas</Text>
      {lists.length === 0 && (
        <Text color="textMuted">
          Junte livros num tema: “terror para começar”, “melhores do ano”…
        </Text>
      )}
      {lists.map((list) => (
        <Pressable
          key={list.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/list/[id]", params: { id: list.id } })}
        >
          <Card style={styles.card}>
            <View style={styles.covers}>
              {list.covers.map((cover, i) => (
                <View key={cover.title} style={i > 0 && styles.overlap}>
                  <BookCover src={cover.coverUrl} title={cover.title} width={40} />
                </View>
              ))}
            </View>
            <View style={styles.flex}>
              <Text variant="title" numberOfLines={2}>
                {list.title}
              </Text>
              <Text variant="label" color="textMuted">
                {bookCountLabel(list.itemCount)}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}
      {isMe && (
        <Button variant="secondary" title="Nova lista" onPress={() => router.push("/new-list")} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  card: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  covers: { flexDirection: "row" },
  overlap: { marginLeft: -24 },
  flex: { flex: 1, gap: spacing[1] },
});
