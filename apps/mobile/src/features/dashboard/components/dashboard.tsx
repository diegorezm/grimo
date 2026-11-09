import { type FeedTab, useFeed, useMe, useShelf, useYearOverview } from "@grimo/client";
import {
  editionPages,
  goalProgress,
  greetingFor,
  groupActivities,
  readingPercent,
} from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, ProgressBar, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { VerifyEmailBanner } from "@/features/account";
import { BookCover, SessionControl } from "@/features/books";
import { FeedItem } from "@/features/feed";
import { NotificationBell } from "@/features/notifications";
import { RetrospectiveBanner } from "@/features/stats";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { FirstSteps } from "./first-steps";
import { StreakLine } from "./streak-line";

/** "Feed" (everyone on Grimo) comes first and is where Início opens; "Seguindo" is one tap away. */
const TABS: { id: FeedTab; label: string }[] = [
  { id: "community", label: "Feed" },
  { id: "following", label: "Seguindo" },
];

/**
 * Início: the year's goal, the streak, the book you are reading, and then the feed (Feed or
 * Seguindo), scrolling to the end.
 */
export function Dashboard() {
  const theme = useTheme();
  const reading = useShelf("reading");
  const year = useYearOverview();
  const [tab, setTab] = useState<FeedTab>("community");
  const feed = useFeed(tab);
  const groups = groupActivities(feed.data?.items ?? []);

  function refresh() {
    void Promise.all([reading.refetch(), year.refetch(), feed.refetch()]);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={["top"]}>
      <FlatList
        data={groups}
        keyExtractor={(group) => group.id}
        renderItem={({ item: { items } }) => <FeedItem item={items[0]!} more={items.slice(1)} />}
        ItemSeparatorComponent={Gap}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<Top tab={tab} onTab={setTab} />}
        ListEmptyComponent={
          feed.isPending ? undefined : tab === "following" ? (
            <View style={styles.empty}>
              <Text color="textMuted">
                Ninguém por aqui ainda. Siga leitores para ver o que estão lendo.
              </Text>
              <Button variant="secondary" title="Ver o feed" onPress={() => setTab("community")} />
            </View>
          ) : (
            <Text color="textMuted">
              Nada no Grimo ainda. Que tal começar marcando o que você está lendo?
            </Text>
          )
        }
        onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
        refreshControl={<RefreshControl refreshing={reading.isRefetching} onRefresh={refresh} />}
      />
    </SafeAreaView>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

/** Everything above the feed: greeting, goal, streak, the book you are reading, the tabs. */
function Top({ tab, onTab }: { tab: FeedTab; onTab: (tab: FeedTab) => void }) {
  const theme = useTheme();
  const dark = useColorScheme() === "dark";
  const me = useMe();
  const reading = useShelf("reading");
  const year = useYearOverview();
  const current = reading.data?.items[0];
  const goal = year.data?.goal ? goalProgress(year.data.goal.target, year.data.goal.done) : null;

  return (
    <View style={styles.top}>
      <View style={styles.header}>
        <Image
          source={
            dark ? require("@/assets/images/logo-dark.png") : require("@/assets/images/logo.png")
          }
          style={styles.logo}
          accessibilityIgnoresInvertColors
        />
        <View style={styles.flex}>
          <Text variant="label" color="textMuted">
            {greetingFor(new Date())}
          </Text>
          <Text variant="display" numberOfLines={1}>
            {me.data?.name.split(" ")[0] ?? "Início"}
          </Text>
        </View>
        <NotificationBell />
      </View>

      <VerifyEmailBanner />
      <FirstSteps />
      <RetrospectiveBanner />

      <View style={styles.status}>
        {goal && year.data && (
          <View style={styles.goal}>
            <View style={styles.between}>
              <Text variant="label" color="textMuted">
                Meta de {year.data.year}
              </Text>
              {goal.done >= goal.target ? (
                <Text variant="label" color="accentInk">
                  Meta batida · {goal.done} de {goal.target}
                </Text>
              ) : (
                <Text variant="label">
                  {goal.done} / {goal.target} livros
                </Text>
              )}
            </View>
            <ProgressBar percent={goal.percent} height={6} />
          </View>
        )}
        <StreakLine />
      </View>

      {current ? (
        <CurrentRead item={current} />
      ) : (
        <Card>
          <Text variant="title">Nenhum livro em leitura</Text>
          <Text color="textMuted">Busque um livro e marque como "Lendo" para acompanhar aqui.</Text>
          <Button title="Buscar livro" onPress={() => router.navigate("/search")} />
        </Card>
      )}

      <View accessibilityRole="tablist" style={[styles.tabs, { borderColor: theme.edge }]}>
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onTab(item.id)}
              style={[styles.tab, active && { borderColor: theme.text }]}
            >
              <Text variant="label" color={active ? "text" : "textMuted"}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ReadingItem = NonNullable<ReturnType<typeof useShelf>["data"]>["items"][number];

/** The "Lendo agora" page: cover, progress and the shortcut to log reading. */
function CurrentRead({ item }: { item: ReadingItem }) {
  const theme = useTheme();
  const { entry, book } = item;
  const percent = readingPercent(entry.currentPage, book.pageCount);
  const open = () => router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } });

  return (
    <View style={[styles.page, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
      <View style={[styles.tape, { backgroundColor: theme.accentStart }]} />
      <Pressable accessibilityRole="button" onPress={open} style={styles.current}>
        <BookCover src={book.coverUrl} title={book.title} width={88} />
        <View style={styles.currentInfo}>
          <Text variant="label" color="accentInk">
            Lendo agora
          </Text>
          <Text variant="heading" numberOfLines={2}>
            {book.title}
          </Text>
          <Text variant="small" color="textMuted" numberOfLines={1}>
            {book.authors.join(", ")}
          </Text>
          {percent !== null && (
            <View style={styles.progress}>
              <View style={styles.pages}>
                <Text variant="number" style={styles.pageNumber}>
                  {entry.currentPage}
                  <Text variant="small" color="textMuted">
                    {" "}
                    / {book.pageCount}
                  </Text>
                </Text>
                <Text variant="label" color="textMuted">
                  {percent}%
                </Text>
              </View>
              <ProgressBar percent={percent} height={6} />
            </View>
          )}
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Button
          title="Atualizar progresso"
          style={styles.flex}
          onPress={() =>
            router.push({ pathname: "/progress/[id]", params: { id: book.openLibraryId } })
          }
        />
        <SessionControl
          compact
          entryId={entry.id}
          page={entry.currentPage}
          pageCount={editionPages(entry.pageCount, book.pageCount)}
          book={book}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: 120 },
  top: { gap: spacing[6], marginBottom: spacing[4] },
  gap: { height: spacing[3] },
  empty: { gap: spacing[3] },
  header: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  logo: { width: 48, height: 48 },
  flex: { flex: 1 },
  status: { gap: spacing[3] },
  goal: { gap: spacing[2] },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tabs: { flexDirection: "row", gap: spacing[5], borderBottomWidth: 1 },
  tab: {
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderColor: "transparent",
    marginBottom: -1,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  page: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[4],
  },
  tape: {
    position: "absolute",
    top: -8,
    right: 28,
    width: 64,
    height: 18,
    opacity: 0.8,
    transform: [{ rotate: "4deg" }],
  },
  current: { flexDirection: "row", gap: spacing[4] },
  currentInfo: { flex: 1, gap: spacing[1] },
  progress: { marginTop: "auto", gap: spacing[2] },
  pages: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  pageNumber: { fontSize: 22 },
});
