import { Pressable, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const ICONS = {
  share: <Path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />,
  gear: (
    <>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  back: <Path d="M15 18l-6-6 6-6" />,
  more: (
    <>
      <Circle cx="5" cy="12" r="1" />
      <Circle cx="12" cy="12" r="1" />
      <Circle cx="19" cy="12" r="1" />
    </>
  ),
} as const;

export type CoverIcon = keyof typeof ICONS;

/** A round icon button on the profile cover (compartilhar, editar, voltar, ⋯). */
export function CoverButton({
  icon,
  label,
  onPress,
}: {
  icon: CoverIcon;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.root,
        { borderColor: theme.edge, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.text}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[icon]}
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
