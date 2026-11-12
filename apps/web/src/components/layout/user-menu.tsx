import type { Me } from "@grimo/client";
import { greetingFor } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  ChevronDownIcon,
  LogOutIcon,
  PencilIcon,
  ShelvesIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/ui/icons";
import { useSignOut } from "@/lib/sign-out";
import { cn } from "@/utils/cn";

const ITEM =
  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none";

/** Avatar button in the top bar: greeting plus shortcuts to profile, preferences and sign out. */
export function UserMenu({ me }: { me: Me }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const signOut = useSignOut();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Menu da conta"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full p-1 transition hover:bg-surface-muted/60 lg:pl-4"
      >
        <span className="hidden text-right text-sm leading-tight lg:block">
          <span className="block text-text-muted">{greetingFor(new Date())},</span>
          <strong className="font-semibold">{me.name}</strong>
        </span>
        <Avatar
          src={me.image}
          name={me.name}
          size="size-10"
          className="bg-accent-gradient font-semibold text-accent-foreground shadow-md shadow-accent/30"
        />
        <ChevronDownIcon
          className={cn("hidden size-4 text-text-muted transition lg:block", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-50 mt-2 flex w-64 flex-col gap-0.5 rounded-xl border border-border bg-surface p-2 shadow-lg shadow-shadow"
        >
          <div className="px-3 py-2">
            <p className="truncate font-semibold">{me.name}</p>
            <p className="truncate font-mono text-xs text-text-muted">@{me.username}</p>
          </div>
          <hr className="my-1 border-border" />
          <MenuLink to="/me" icon={<UserIcon className="size-5" />} onPick={() => setOpen(false)}>
            Meu perfil
          </MenuLink>
          <Link
            to="/me"
            search={{ panel: "profile" }}
            onClick={() => setOpen(false)}
            className={ITEM}
          >
            <PencilIcon className="size-5" />
            Editar perfil
          </Link>
          <MenuLink
            to="/shelves"
            icon={<ShelvesIcon className="size-5" />}
            onPick={() => setOpen(false)}
          >
            Minhas estantes
          </MenuLink>
          <hr className="my-1 border-border" />
          <MenuLink to="/settings/preferences" onPick={() => setOpen(false)}>
            Preferências
          </MenuLink>
          <MenuLink to="/settings/account" onPick={() => setOpen(false)}>
            Conta e privacidade
          </MenuLink>
          {me.isStaff && (
            <MenuLink
              to="/admin"
              icon={<ShieldIcon className="size-5" />}
              onPick={() => setOpen(false)}
            >
              Moderação
            </MenuLink>
          )}
          <hr className="my-1 border-border" />
          <button
            type="button"
            onClick={() => void signOut()}
            className={cn(ITEM, "text-danger hover:bg-danger/10")}
          >
            <LogOutIcon className="size-5" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  to,
  icon,
  onPick,
  children,
}: {
  to: "/me" | "/shelves" | "/settings/preferences" | "/settings/account" | "/admin";
  icon?: ReactNode;
  onPick: () => void;
  children: ReactNode;
}) {
  return (
    <Link to={to} onClick={onPick} className={ITEM}>
      {icon ?? <span className="size-5" />}
      {children}
    </Link>
  );
}
