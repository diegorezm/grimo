import { AUTH_BASE_PATH, sharedAuthClientPlugins } from "@grimo/auth/client";
import { createAuthClient } from "better-auth/react";

// Same origin as the page — the web worker forwards /api/* to the API.
export const authClient = createAuthClient({
  basePath: AUTH_BASE_PATH,
  plugins: sharedAuthClientPlugins(),
});
