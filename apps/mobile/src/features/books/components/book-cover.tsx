import { coverUrl } from "@grimo/core";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function BookCover({
  src,
  title,
  width = 56,
}: {
  src: string | null;
  title: string;
  width?: number;
}) {
  const theme = useTheme();
  const size = { width, height: width * 1.5, backgroundColor: theme.surfaceMuted };
  if (src)
    return <Image source={coverUrl(src, "M")} style={[styles.base, size]} contentFit="cover" />;
  return (
    <View style={[styles.base, styles.placeholder, size]}>
      <Text variant="small" numberOfLines={3} style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.sm },
  placeholder: { alignItems: "center", justifyContent: "center", padding: 4 },
  title: { fontSize: 10, textAlign: "center" },
});
