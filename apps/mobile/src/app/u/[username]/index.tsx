import { useLocalSearchParams } from "expo-router";
import { ReaderProfile } from "@/features/readers";

export default function ReaderScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <ReaderProfile username={username} />;
}
