import { useMe, useSyncTimeZone } from "@grimo/client";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  type ErrorBoundaryProps,
  Stack,
  ThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { Button, Screen, Text } from "@/components/ui";
import { fontAssets } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeStore } from "@/lib/theme";
import { AppProviders, useAppCache, useAuthClient } from "@/providers/app-providers";

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
  // A new account confirms name and @ first (`needsSetup`); cached, so this works offline too.
  // Then, when the Terms or Privacy Policy changed (or the reader is under 16): `legal`.
  const me = useMe({ enabled: Boolean(session) }).data;
  useSyncTimeZone(Boolean(session));
  const needsSetup = me?.needsSetup ?? false;
  const needsLegal = !needsSetup && Boolean(me?.legal.needsAcceptance || me?.legal.underage);
  const [fontsLoaded] = useFonts(fontAssets);
  useThemeStore(); // subscribes so the saved appearance is applied on startup
  const ready = fontsLoaded && !isPending;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(session) && needsSetup}>
        <Stack.Screen name="setup" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && needsLegal}>
        <Stack.Screen name="legal" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && !needsSetup && !needsLegal}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book/[id]" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="account" />
        <Stack.Screen
          name="report"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.75],
            sheetGrabberVisible: true,
          }}
        />
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
  const appCache = useAppCache();
  const previous = useRef(sessionId);
  useEffect(() => {
    if (previous.current && !sessionId) void appCache.clearForSignOut();
    previous.current = sessionId;
  }, [sessionId, appCache]);
}

/** Expo Router's error boundary: a screen that throws shows this instead of a blank screen. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <Screen>
      <Text variant="heading">Algo deu errado</Text>
      <Text color="textMuted">
        Essa tela não carregou direito. Seus dados estão salvos; tente de novo.
      </Text>
      <Button title="Tentar de novo" onPress={retry} />
    </Screen>
  );
}
