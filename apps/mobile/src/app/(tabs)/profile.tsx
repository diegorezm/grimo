import { type Profile, useMe, useReader, useStreak } from "@grimo/client";
import { router } from "expo-router";
import { Button, Screen } from "@/components/ui";
import { ProfileHeader, ProfileHighlights, ProfileTabs, RoundButton } from "@/features/profile";

/**
 * Your profile, as others see it (plus the photo picker and your streak). Settings live behind
 * the gear: appearance, account and sign out.
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
        corner={<RoundButton label="Ajustes" glyph="⚙" onPress={() => router.push("/settings")} />}
        actions={
          <Button
            variant="secondary"
            title="Editar perfil"
            onPress={() => router.push("/profile-edit")}
          />
        }
      />
      {page && (
        <>
          <ProfileHighlights page={page} streak={streak?.days ?? null} />
          <ProfileTabs page={page} username={me.username} isMe />
        </>
      )}
    </>
  );
}
