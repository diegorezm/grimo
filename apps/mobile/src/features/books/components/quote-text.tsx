import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { Fonts, fontSize, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** A saved passage: the words in serif, between quote marks, and the page it is on. */
export function QuoteText({ body, page }: { body: string; page: number | null }) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { borderLeftColor: theme.accent }]}>
      <Text style={styles.quote}>“{body}”</Text>
      {page ? (
        <Text variant="label" color="textMuted">
          p. {page}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderLeftWidth: 2, paddingLeft: spacing[3], gap: spacing[1] },
  quote: { fontFamily: Fonts.serif, fontStyle: "italic", fontSize: fontSize.lg, lineHeight: 26 },
});
