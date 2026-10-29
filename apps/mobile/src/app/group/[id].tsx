import { useLocalSearchParams } from "expo-router";
import { GroupScreen } from "@/features/groups";

export default function GroupRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GroupScreen id={id} />;
}
