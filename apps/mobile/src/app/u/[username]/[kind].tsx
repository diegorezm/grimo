import type { ConnectionKind } from "@grimo/client";
import { useLocalSearchParams } from "expo-router";
import { ConnectionsList } from "@/features/readers";

export default function ConnectionsScreen() {
  const { username, kind } = useLocalSearchParams<{ username: string; kind: ConnectionKind }>();
  return (
    <ConnectionsList username={username} kind={kind === "following" ? "following" : "followers"} />
  );
}
