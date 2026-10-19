import { meQuery, useMe } from "@grimo/client";
import { createFileRoute, useCanGoBack, useRouter } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { ProfileForm, ProfileFormActions } from "@/features/profile";

/** Edit profile expanded from the side peek. */
export const Route = createFileRoute("/_app/settings/profile")({
  loader: ({ context: { queryClient, api } }) => {
    void queryClient.prefetchQuery(meQuery(api));
  },
  component: EditProfilePage,
});

function EditProfilePage() {
  const me = useMe();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const leave = () => (canGoBack ? router.history.back() : router.navigate({ to: "/me" }));

  if (!me.data) return <Spinner />;
  return (
    <Screen back="Voltar">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <ProfileForm key={me.data.id} profile={me.data} onDone={leave} />
        <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface px-4 py-4 lg:-mx-8 lg:px-8">
          <ProfileFormActions onCancel={leave} />
        </div>
      </div>
    </Screen>
  );
}
