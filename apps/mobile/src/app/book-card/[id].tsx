import { useLocalSearchParams } from "expo-router";
import { FinishedCardStudio } from "@/features/stats";

export default function FinishedCardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FinishedCardStudio openLibraryId={id} />;
}
