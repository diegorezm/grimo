import { useLocalSearchParams } from "expo-router";
import { CardStudio } from "@/features/stats";

/** `/card?year=2026` opens the studio on that year's retrospectiva. */
export default function CardScreen() {
  const params = useLocalSearchParams<{ year?: string }>();
  const year = Number(params.year);
  return <CardStudio year={Number.isInteger(year) ? year : undefined} />;
}
