import { Screen } from "@/components/ui";
import { LegalAccept } from "@/features/legal";

/** Terms changed (or never accepted), or the reader is under 16: before the tabs. */
export default function LegalScreen() {
  return (
    <Screen>
      <LegalAccept />
    </Screen>
  );
}
