import { useMe } from "@grimo/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { ProfileEditor, ProfileHeader } from "@/features/profile";
import { MonthlyCard, YearStats } from "@/features/stats";
import { queryClient } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app/me")({
  component: MePage,
});

function MePage() {
  const me = useMe();
  const navigate = useNavigate();

  async function signOut() {
    await authClient.signOut();
    queryClient.clear();
    await navigate({ to: "/login" });
  }

  if (!me.data) return <Spinner />;
  return (
    <Screen>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-8">
          <ProfileHeader
            profile={me.data}
            actions={
              <Button variant="secondary" onClick={signOut}>
                Sair
              </Button>
            }
          />
          <YearStats />
          <ProfileEditor key={me.data.id} profile={me.data} />
        </div>
        <aside
          aria-labelledby="monthly-title"
          className="flex flex-col items-center gap-4 rounded-xl bg-surface-muted/70 p-5 lg:sticky lg:top-6 lg:self-start"
        >
          <div className="w-full">
            <h2 id="monthly-title" className="text-xl font-medium italic">
              Resumo do mês
            </h2>
            <p className="text-sm text-text-muted">Pronto para os Stories.</p>
          </div>
          <MonthlyCard />
        </aside>
      </div>
    </Screen>
  );
}
