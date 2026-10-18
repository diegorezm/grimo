/**
 * Client-safe auth pieces shared by web and mobile.
 * Never import server code (`./server`) from here.
 */
import { usernameClient } from "better-auth/client/plugins";

export const AUTH_BASE_PATH = "/api/auth";

/** Plugins every client must register so types/endpoints match the server. */
export const sharedAuthClientPlugins = () => [usernameClient()];
