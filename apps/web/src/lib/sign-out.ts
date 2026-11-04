import { useNavigate } from "@tanstack/react-router";
import { clearCacheForSignOut } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

/** Clears the cache, ends the session and goes to the login screen. */
export function useSignOut() {
  const navigate = useNavigate();
  return async () => {
    await clearCacheForSignOut();
    await authClient.signOut();
    await navigate({ to: "/login" });
  };
}
