import { useLocalSearchParams } from "expo-router";
import { ProgressSheet } from "@/features/books";

export default function ProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProgressSheet openLibraryId={id} />;
}
