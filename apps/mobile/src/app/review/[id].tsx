import { useLocalSearchParams } from "expo-router";
import { ReviewComposer } from "@/features/posts";

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReviewComposer openLibraryId={id} />;
}
