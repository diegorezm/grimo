import { StyleSheet, View } from "react-native";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Avatar } from "./avatar";

/** Overlapping avatars for "who else": the first `max`, in order. */
export function AvatarStack({
  people,
  max = 3,
  size = 24,
}: {
  people: { id: string; name: string; image: string | null }[];
  max?: number;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {people.slice(0, max).map((person, i) => (
        <View
          key={person.id}
          style={[
            styles.ring,
            { borderColor: theme.background, marginLeft: i === 0 ? 0 : -size / 3 },
          ]}
        >
          <Avatar image={person.image} name={person.name} size={size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  ring: { borderWidth: 2, borderRadius: radius.full },
});
