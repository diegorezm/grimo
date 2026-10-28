import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./text";

/** Round photo, or the first letter of the name when there is none. */
export function Avatar({
  image,
  name,
  size = 32,
}: {
  image: string | null;
  name: string;
  size?: number;
}) {
  const theme = useTheme();
  const box = { width: size, height: size };
  if (image) return <Image source={image} style={[styles.round, box]} />;
  return (
    <View style={[styles.round, styles.initial, box, { backgroundColor: theme.surfaceMuted }]}>
      <Text variant="label" style={{ fontSize: Math.max(11, size * 0.4) }}>
        {name.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  round: { borderRadius: radius.full },
  initial: { alignItems: "center", justifyContent: "center" },
});
