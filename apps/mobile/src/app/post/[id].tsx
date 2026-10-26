import { useLocalSearchParams } from "expo-router";
import { PostThread } from "@/features/posts";

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PostThread postId={id} />;
}
