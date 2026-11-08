import { type ReaderPage, useReaderActivity } from "@grimo/client";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookTile } from "@/features/books";
import { FeedItem } from "@/features/feed";
import { ReaderLists } from "@/features/lists";
import { MonthlyCard, YearStats } from "@/features/stats";
import { useTheme } from "@/hooks/use-theme";

const TABS = [
  { id: "activity", label: "Atividade" },
  { id: "books", label: "Livros" },
  { id: "lists", label: "Listas" },
  { id: "year", label: "Ano" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/**
 * The bottom of a profile, one part at a time: what the reader posted, their best rated and
 * current books, their lists, and the year (with the monthly card on your own profile).
 */
export function ProfileTabs({
  page,
  username,
  isMe,
}: {
  page: ReaderPage;
  username: string;
  isMe: boolean;
}) {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("activity");
  return (
    <View style={styles.root}>
      <View style={[styles.bar, { borderColor: theme.edge }]} accessibilityRole="tablist">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
              style={[styles.tab, active && { borderColor: theme.text }]}
            >
              <Text variant="label" color={active ? "text" : "textMuted"}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {tab === "activity" && <Activity username={username} />}
      {tab === "books" && <Books page={page} />}
      {tab === "lists" && <ReaderLists username={username} isMe={isMe} />}
      {tab === "year" && (
        <>
          <YearStats overview={page.stats} />
          {isMe && (
            <>
              <Text variant="heading">Card do mês</Text>
              <MonthlyCard />
            </>
          )}
        </>
      )}
    </View>
  );
}

function Books({ page }: { page: ReaderPage }) {
  const { reading, favorites } = page.books;
  if (reading.length === 0 && favorites.length === 0) {
    return <Text color="textMuted">Nenhum livro lido ou em leitura ainda.</Text>;
  }
  return (
    <>
      {reading.length > 0 && (
        <Row title="Lendo">
          {reading.map(({ entry, book }) => (
            <BookTile key={entry.id} book={book} currentPage={entry.currentPage} />
          ))}
        </Row>
      )}
      {favorites.length > 0 && (
        <Row title="Melhores notas">
          {favorites.map(({ entry, book }) => (
            <BookTile key={entry.id} book={book} rating={entry.rating} />
          ))}
        </Row>
      )}
    </>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
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
  root: { gap: spacing[4] },
  bar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderColor: "transparent",
    marginBottom: -1,
  },
  section: { gap: spacing[3] },
  row: { gap: spacing[3] },
});
