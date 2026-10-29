import { useLocalSearchParams } from "expo-router";
import { GroupCardStudio } from "@/features/groups";

export default function GroupCardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GroupCardStudio id={id} />;
}
