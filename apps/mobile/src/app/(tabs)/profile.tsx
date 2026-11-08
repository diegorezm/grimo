import { type Profile, useMe, useReader, useStreak } from "@grimo/client";
import { router } from "expo-router";
import { Share } from "react-native";
import { Screen } from "@/components/ui";
import { CoverButton, ProfileHeader, ProfileReadingNow, ProfileTabs } from "@/features/profile";
import { SITE_URL } from "@/lib/server";

/**
 * Your profile, as others see it (plus the photo picker and your streak). On the cover: share
 * the profile, and the gear to edit it (settings are inside the edit screen).
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
            <CoverButton
              icon="share"
              label="Compartilhar perfil"
              onPress={() =>
                void Share.share({
                  message: `Me segue no Grimo: @${me.username} ${SITE_URL}/u/${me.username}`,
                })
              }
            />
            <CoverButton
              icon="gear"
              label="Editar perfil"
              onPress={() => router.push("/profile-edit")}
            />
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
