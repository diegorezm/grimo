import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

// Convex accepts the JWTs that Better Auth's `convex` plugin issues (see convex/auth.ts).
export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
