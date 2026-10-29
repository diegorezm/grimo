import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";
import { useTheme } from "@/hooks/use-theme";

export default function TabsLayout() {
  const theme = useTheme();
  const ios = Platform.OS === "ios";
  return (
    // On iOS 26 NativeTabs is the system liquid glass capsule: no background, only a tint.
    <NativeTabs
      tintColor={theme.accent}
      minimizeBehavior="onScrollDown"
      backgroundColor={ios ? undefined : theme.background}
      indicatorColor={ios ? undefined : theme.surfaceMuted}
      labelStyle={{ selected: { color: theme.accent } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Feed</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="juntos">
        <NativeTabs.Trigger.Label>Juntos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" md="group" />
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
