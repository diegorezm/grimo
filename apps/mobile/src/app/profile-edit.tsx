import { useMe } from "@grimo/client";
import { Screen } from "@/components/ui";
import { ProfileForm } from "@/features/profile";

export default function ProfileEditScreen() {
  const me = useMe().data;
  // `me` is cached, so this only shows empty for a moment on the very first run.
  return me ? <ProfileForm profile={me} /> : <Screen>{null}</Screen>;
}
