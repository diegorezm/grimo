import { REPORT_TARGETS, type ReportTarget } from "@grimo/core";
import { useLocalSearchParams } from "expo-router";
import { ReportSheet } from "@/features/moderation";

export default function ReportScreen() {
  const { target, id } = useLocalSearchParams<{ target: string; id: string }>();
  const kind = REPORT_TARGETS.includes(target as ReportTarget) ? (target as ReportTarget) : "post";
  return <ReportSheet target={kind} targetId={id} />;
}
