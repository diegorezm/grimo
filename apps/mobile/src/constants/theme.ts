// Per-weight imports: only these files get bundled (the package root pulls every weight).
import { Fraunces_500Medium_Italic } from "@expo-google-fonts/fraunces/500Medium_Italic";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces/700Bold";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono/500Medium";
import { IBMPlexMono_600SemiBold } from "@expo-google-fonts/ibm-plex-mono/600SemiBold";
import { Nunito_400Regular } from "@expo-google-fonts/nunito/400Regular";
import { Nunito_700Bold } from "@expo-google-fonts/nunito/700Bold";
import { Nunito_800ExtraBold } from "@expo-google-fonts/nunito/800ExtraBold";
import { colors } from "@grimo/tokens";

// Colors/spacing/radius come from @grimo/tokens (shared with web). Only fonts live here.
export {
  fontSize,
  radius,
  shelfBadges,
  shelfColors,
  spacing,
  storyCard,
} from "@grimo/tokens";

export const Colors = colors;
export type ThemeColor = keyof typeof colors.light;

/** Font files loaded in the root layout (same families as the web: tokens `fonts`). */
export const fontAssets = {
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
};

export const Fonts = {
  serif: "Fraunces_600SemiBold",
  serifBold: "Fraunces_700Bold",
  serifItalic: "Fraunces_500Medium_Italic",
  mono: "IBMPlexMono_500Medium",
  monoBold: "IBMPlexMono_600SemiBold",
  sans: "Nunito_400Regular",
  sansBold: "Nunito_700Bold",
  sansHeavy: "Nunito_800ExtraBold",
} as const satisfies Record<string, keyof typeof fontAssets>;
