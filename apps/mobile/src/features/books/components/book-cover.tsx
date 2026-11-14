import { coverUrl } from "@grimo/core";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Book cover at 2:3 with a soft page shadow; a titled placeholder when there is no image. */
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
  const size = { width, height: width * 1.5 };
  return (
    <View style={[styles.frame, size]}>
      {src ? (
        <Image
          source={coverUrl(src, "M")}
          style={[
            styles.image,
            size,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.edge },
          ]}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`Capa de ${title}`}
        />
      ) : (
        <View style={[styles.image, styles.placeholder, size, { backgroundColor: theme.ornament }]}>
          <Text
            variant="small"
            numberOfLines={4}
            style={[styles.title, { color: theme.accentForeground, fontSize: width / 7 }]}
          >
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.sm },
  // A hairline keeps white covers apart from the white page (no shadow).
  image: { borderRadius: radius.sm, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  placeholder: { alignItems: "center", justifyContent: "center", padding: 6 },
  title: { textAlign: "center", fontWeight: "700" },
});
