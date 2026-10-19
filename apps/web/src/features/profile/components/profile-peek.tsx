import { useMe } from "@grimo/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { ExpandIcon, SidePeek } from "@/components/layout/side-peek";
import { ProfileForm, ProfileFormActions } from "./profile-form";

/** Edit profile as a side peek (opened with `?panel=profile` on any screen). */
export function ProfilePeek() {
  const navigate = useNavigate();
  const me = useMe();
  const close = useCallback(
    () =>
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, panel: undefined }),
        resetScroll: false,
      }),
    [navigate],
  );

  return (
    <SidePeek
      label="Editar perfil"
      onClose={close}
      expand={
        <Link
          to="/settings/profile"
          aria-label="Abrir como página"
          title="Abrir como página"
          className="grid size-9 place-items-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text"
        >
          <ExpandIcon />
        </Link>
      }
      footer={<ProfileFormActions onCancel={close} />}
    >
      {me.data && <ProfileForm key={me.data.id} profile={me.data} onDone={close} />}
    </SidePeek>
  );
}
