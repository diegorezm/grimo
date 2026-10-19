import { useInstance } from "@grimo/client";
import { NativeTabs } from "expo-router/native-tabs";
import { useTheme } from "@/hooks/use-theme";

export default function TabsLayout() {
  const theme = useTheme();
  const personal = useInstance().data?.mode === "personal";
  return (
    <NativeTabs
      backgroundColor={theme.background}
      // iOS 26+ renders NativeTabs as system liquid glass; we only tint it.
      tintColor={theme.accent}
      indicatorColor={theme.surfaceMuted}
      labelStyle={{ selected: { color: theme.accent } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{personal ? "Diário" : "Feed"}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shelves">
        <NativeTabs.Trigger.Label>Estantes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="books.vertical" md="book" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
