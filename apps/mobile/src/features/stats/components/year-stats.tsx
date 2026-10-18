import { useYearOverview } from "@grimo/client";
import { GENRE_LABELS, type Genre, goalProgress } from "@grimo/core";
import { StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function YearStats() {
  const theme = useTheme();
  const { data } = useYearOverview();
  if (!data) return null;
  const goal = data.goal ? goalProgress(data.goal.target, data.goal.done) : null;
  const genre = data.topGenre ? (GENRE_LABELS[data.topGenre as Genre] ?? data.topGenre) : "—";

  return (
    <Card>
      <View style={styles.row}>
        <Stat label="livros lidos" value={data.booksRead} />
        <Stat label="páginas" value={data.pagesRead} />
        <Stat label="gênero favorito" value={genre} />
      </View>
      {goal && (
        <View style={styles.goal}>
          <Text variant="small" color="textMuted">
            Meta {data.year}: {goal.done}/{goal.target} livros
          </Text>
          <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
            <View
              style={[styles.bar, { width: `${goal.percent}%`, backgroundColor: theme.primary }]}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text variant="heading" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="small" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing[2] },
  stat: { flex: 1, alignItems: "center" },
  goal: { gap: spacing[1] },
  track: { height: 8, borderRadius: radius.full, overflow: "hidden" },
  bar: { height: "100%" },
});
