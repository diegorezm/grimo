import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppProviders, useAuthClient } from "@/providers/app-providers";

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

/** Auth gate: signed-in users see the tabs, everyone else the sign-in screen. */
function RootNavigator() {
  const { data: session, isPending } = useAuthClient().useSession();

  useEffect(() => {
    if (!isPending) SplashScreen.hideAsync();
  }, [isPending]);

  if (isPending) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
