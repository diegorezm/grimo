import { useLocalSearchParams } from "expo-router";
import { FinishSheet } from "@/features/books";

export default function FinishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FinishSheet openLibraryId={id} />;
}
