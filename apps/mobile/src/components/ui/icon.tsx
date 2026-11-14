import Svg, { Circle, Path } from "react-native-svg";
import type { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Line icons, one stroke weight for the whole app (no emoji or text glyphs as icons). Drawn on a
 * 24 grid; `size` scales them.
 */
const ICONS = {
  chevronRight: <Path d="M9 6l6 6-6 6" />,
  chevronDown: <Path d="M6 9l6 6 6-6" />,
  timer: (
    <>
      <Circle cx={12} cy={13} r={8} />
      <Path d="M12 9v4l2 2M9 2h6" />
    </>
  ),
  heart: <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-4-4" />
    </>
  ),
  bell: <Path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  alert: <Path d="M12 6v8M12 18v.5" />,
  cloudOff: <Path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.3 4.4 4.4 0 0 0 7 18zM4 4l16 16" />,
  link: (
    <Path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" />
  ),
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 18,
  color = "text",
  filled = false,
}: {
  name: IconName;
  size?: number;
  color?: ThemeColor;
  /** Fills the shape (a liked heart). */
  filled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? theme[color] : "none"}
      stroke={theme[color]}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {ICONS[name]}
    </Svg>
  );
}
