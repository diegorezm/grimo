import { useLocalSearchParams } from "expo-router";
import { QuoteCardStudio } from "@/features/stats";

export default function QuoteCardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <QuoteCardStudio postId={id} />;
}
