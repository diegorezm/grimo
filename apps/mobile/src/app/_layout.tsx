import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { fontAssets } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeStore } from "@/lib/theme";
import { AppProviders, useAuthClient, useClearCache } from "@/providers/app-providers";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <AppProviders>
      <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootNavigator />
      </ThemeProvider>
    </AppProviders>
  );
}

/**
 * Auth gate: signed-in users see the tabs, everyone else the sign-in screen. The session is
 * restored from SecureStore, so the app opens offline on the persisted cache; a network error
 * keeps it, only the server saying "no session" signs out.
 */
function RootNavigator() {
  const { data: session, isPending } = useAuthClient().useSession();
  useClearCacheOnSignOut(session?.session.id ?? null);
  const [fontsLoaded] = useFonts(fontAssets);
  useThemeStore(); // subscribes so the saved appearance is applied on startup
  const ready = fontsLoaded && !isPending;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book/[id]" />
        {/* Native sheets: on iOS 26 they get the system liquid glass. */}
        <Stack.Screen
          name="progress/[id]"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.55, 0.8],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="review/[id]"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.85],
            sheetGrabberVisible: true,
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

/** The session ended (sign-out, expired, revoked): nothing from that account stays cached. */
function useClearCacheOnSignOut(sessionId: string | null) {
  const clearCache = useClearCache();
  const previous = useRef(sessionId);
  useEffect(() => {
    if (previous.current && !sessionId) void clearCache();
    previous.current = sessionId;
  }, [sessionId, clearCache]);
}
