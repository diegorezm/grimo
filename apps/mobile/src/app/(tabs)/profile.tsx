import { type Profile, useMe, useReader, useStreak } from "@grimo/client";
import { router } from "expo-router";
import { Screen } from "@/components/ui";
import { CoverButton, ProfileHeader, ProfileReadingNow, ProfileTabs } from "@/features/profile";

/**
 * Your profile, as others see it (plus the photo picker and your streak). "Editar perfil" and
 * "Ajustes" (appearance, account, sign out) sit quietly on the cover.
 */
export default function ProfileScreen() {
  const me = useMe().data;
  return <Screen>{me && <MyProfile me={me} />}</Screen>;
}

function MyProfile({ me }: { me: Profile }) {
  const page = useReader(me.username).data;
  const streak = useStreak().data;
  return (
    <>
      <ProfileHeader
        profile={me}
        editable
        onPressCount={(kind) =>
          router.push({ pathname: "/u/[username]/[kind]", params: { username: me.username, kind } })
        }
        corner={
          <>
            <CoverButton title="Editar perfil" onPress={() => router.push("/profile-edit")} />
            <CoverButton title="Ajustes" onPress={() => router.push("/settings")} />
          </>
        }
      />
      {page && (
        <>
          <ProfileReadingNow page={page} />
          <ProfileTabs page={page} username={me.username} isMe streak={streak?.days ?? null} />
        </>
      )}
    </>
  );
}
