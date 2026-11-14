import {
  type ReaderPage,
  useProfileShelves,
  useReaderActivity,
  useReaderShelves,
} from "@grimo/client";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { FeedItem } from "@/features/feed";
import { MonthlyCard, YearStats } from "@/features/stats";
import { useTheme } from "@/hooks/use-theme";
import { ProfileFeatured } from "./profile-highlights";
import { ProfileShelves } from "./profile-shelves";

const TABS = [
  { id: "shelves", label: "Estantes" },
  { id: "featured", label: "Destaques" },
  { id: "activity", label: "Atividade" },
  { id: "year", label: "Ano" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/**
 * The bottom of a profile, one part at a time: the shelves (previews that open the whole shelf),
 * the highlights, what the reader posted, and the year (with the monthly card on your own).
 */
export function ProfileTabs({
  page,
  username,
  isMe,
  streak,
}: {
  page: ReaderPage;
  username: string;
  isMe: boolean;
  /** Your own streak (private), for Destaques. */
  streak?: number | null;
}) {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("shelves");
  const reader = useReaderShelves(username).data;
  const made = useProfileShelves(username).data?.items ?? [];
  // Lendo and Lidos (when they have books) and the shelves the reader made.
  const shelfCount =
    (reader && reader.reading.count > 0 ? 1 : 0) +
    (reader && reader.read.count > 0 ? 1 : 0) +
    made.length;
  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.bar, { borderColor: theme.edge }]}
        contentContainerStyle={styles.barContent}
        accessibilityRole="tablist"
      >
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
              <View style={styles.tabLabel}>
                <Text variant="label" color={active ? "text" : "textMuted"}>
                  {item.label}
                </Text>
                {item.id === "shelves" && shelfCount > 0 && (
                  <Text variant="label" color="textMuted">
                    {shelfCount}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      {tab === "activity" && <Activity username={username} />}
      {tab === "shelves" && <ProfileShelves username={username} />}
      {tab === "featured" && <ProfileFeatured page={page} streak={streak} />}
      {tab === "year" && (
        <>
          <YearStats overview={page.stats ?? undefined} />
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
  tabLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  root: { gap: spacing[4] },
  bar: { borderBottomWidth: 1, flexGrow: 0 },
  barContent: { flexGrow: 1 },
  tab: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderColor: "transparent",
    marginBottom: -1,
  },
  section: { gap: spacing[3] },
  row: { gap: spacing[3] },
});
