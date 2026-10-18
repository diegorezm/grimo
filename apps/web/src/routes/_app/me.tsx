import { useMe } from "@grimo/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/features/profile";
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
    <div className="flex flex-col gap-6">
      <ProfileHeader
        profile={me.data}
        actions={
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        }
      />
      <YearStats />
      <h2 className="text-xl font-bold">Resumo do mês</h2>
      <MonthlyCard />
    </div>
  );
}
