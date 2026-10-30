import { useLocalSearchParams } from "expo-router";
import { QuoteComposer } from "@/features/posts";

export default function QuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <QuoteComposer openLibraryId={id} />;
}
