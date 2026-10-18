import type { AuthSession, AuthUser } from "@grimo/auth";
import type { AppServices } from "./services";

/** Hono env. Note: no runtime bindings here — the API is runtime-agnostic. */
export interface AppEnv {
  Variables: AppServices & {
    user: AuthUser | null;
    session: AuthSession["session"] | null;
  };
}
