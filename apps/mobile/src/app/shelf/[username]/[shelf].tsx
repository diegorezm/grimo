import { useLocalSearchParams } from "expo-router";
import { FullShelf } from "@/features/shelves";

export default function FullShelfScreen() {
  const { username, shelf } = useLocalSearchParams<{ username: string; shelf: string }>();
  return <FullShelf username={username} shelf={shelf} />;
}
