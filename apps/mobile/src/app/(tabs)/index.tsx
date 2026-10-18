import { Screen } from "@/components/ui";
import { FeedList } from "@/features/feed";

export default function FeedScreen() {
  return (
    <Screen scroll={false}>
      <FeedList />
    </Screen>
  );
}
