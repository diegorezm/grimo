import { useFeed, useMe, useShelf, useShelfScreenStore, useYearOverview } from "@grimo/client";
import { editionPages, goalProgress, greetingFor, readingPercent } from "@grimo/core";
import { router } from "expo-router";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Icon, ProgressBar, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { VerifyEmailBanner } from "@/features/account";
import { BookCover, BookTile, SessionControl } from "@/features/books";
import { FeedItem } from "@/features/feed";
import { NotificationBell } from "@/features/notifications";
import { ShelfTiles } from "@/features/shelves";
import { RetrospectiveBanner } from "@/features/stats";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { FirstSteps } from "./first-steps";
import { FriendsWantRow } from "./friends-want-row";
import { StreakLine } from "./streak-line";
import { TrendingRow } from "./trending-row";

/** Início / Diário: what you are reading, the yearly goal, your shelves and your network. */
export function Dashboard() {
  const theme = useTheme();
  const dark = useColorScheme() === "dark";
  const me = useMe();
  const reading = useShelf("reading");
  const year = useYearOverview();
  const feed = useFeed();
  const books = reading.data?.items ?? [];
  const [current, ...others] = books;
  const activity = (feed.data?.items ?? []).slice(0, 5);
  const goal = year.data?.goal ? goalProgress(year.data.goal.target, year.data.goal.done) : null;

  function refresh() {
    void Promise.all([reading.refetch(), year.refetch(), feed.refetch()]);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={reading.isRefetching} onRefresh={refresh} />}
      >
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

        <StreakLine />
        <VerifyEmailBanner />
        <FirstSteps />
        <RetrospectiveBanner />

        {current ? (
          <CurrentRead item={current} />
        ) : (
          <Card>
            <Text variant="title">Nenhum livro em leitura</Text>
            <Text color="textMuted">
              Busque um livro e marque como "Lendo" para acompanhar aqui.
            </Text>
            <Button title="Buscar livro" onPress={() => router.navigate("/search")} />
          </Card>
        )}

        {others.length > 0 && (
          <View style={styles.section}>
            <Text variant="heading">Também lendo</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
            >
              {others.map(({ entry, book }) => (
                <BookTile key={entry.id} book={book} currentPage={entry.currentPage} width={96} />
              ))}
            </ScrollView>
          </View>
        )}

        {goal && year.data && (
          <View style={styles.goal}>
            <View style={styles.sectionHead}>
              <Text variant="label" color="textMuted">
                Meta de {year.data.year}
              </Text>
              <Text variant="label">
                {goal.done} / {goal.target} livros
              </Text>
            </View>
            <ProgressBar percent={goal.percent} height={6} />
          </View>
        )}

        <View style={styles.section}>
          <Text variant="heading">Estantes</Text>
          <ShelfTiles
            onSelect={(status) => {
              // Opens the shelf filtered by that status.
              useShelfScreenStore.getState().showStatus(status);
              router.navigate("/shelves");
            }}
          />
        </View>

        <TrendingRow />
        <FriendsWantRow />

        {activity.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text variant="heading">Da sua rede</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/feed")}
                hitSlop={8}
              >
                <View style={styles.link}>
                  <Text variant="label" color="accentInk">
                    Ver feed
                  </Text>
                  <Icon name="chevronRight" size={14} color="accentInk" />
                </View>
              </Pressable>
            </View>
            {activity.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    gap: spacing[6],
    paddingBottom: 120,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  logo: { width: 48, height: 48 },
  flex: { flex: 1 },
  section: { gap: spacing[3] },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { gap: spacing[3], paddingRight: spacing[5] },
  goal: { gap: spacing[2] },
  link: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
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
