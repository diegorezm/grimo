import { useLocalSearchParams } from "expo-router";
import { ListPicker } from "@/features/lists";

export default function AddToListRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListPicker openLibraryId={id} />;
}
