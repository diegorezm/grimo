import { useLocalSearchParams } from "expo-router";
import { BookDetail } from "@/features/books";

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookDetail openLibraryId={id} />;
}
