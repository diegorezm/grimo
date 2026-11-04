import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { PreferencesSettings } from "@/features/account";

/** Display preferences kept on this device: theme and shelf view. */
export const Route = createFileRoute("/_app/settings/preferences")({
  component: PreferencesPage,
});

function PreferencesPage() {
  return (
    <Screen back="Voltar" title="Preferências">
      <div className="mx-auto w-full max-w-2xl">
        <PreferencesSettings />
      </div>
    </Screen>
  );
}
