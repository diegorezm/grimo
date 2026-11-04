import { useLocalSearchParams } from "expo-router";
import { ListScreen } from "@/features/lists";

export default function ListRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListScreen id={id} />;
}
