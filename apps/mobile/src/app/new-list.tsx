import { useLocalSearchParams } from "expo-router";
import { ListForm } from "@/features/lists";

/** "Nova lista" (or editing one, with `?id=`). */
export default function NewListRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <ListForm id={id} />;
}
