import { expo } from "@better-auth/expo";
import type { Database } from "@grimo/db";
import { account, session, user, verification } from "@grimo/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { username } from "better-auth/plugins";
import { AUTH_BASE_PATH } from "./client";

export interface AuthConfig {
  db: Database;
  secret: string;
  baseURL: string;
  /** Web origins + the mobile app scheme (e.g. `grimo://`). */
  trustedOrigins: string[];
  /** Instance policy: return false to block new accounts (e.g. personal mode). */
  canSignUp?: () => Promise<boolean>;
}

/** Runtime-agnostic: used by the Cloudflare Worker and the self-hosted Node server. */
export function createAuth(config: AuthConfig) {
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: AUTH_BASE_PATH,
    trustedOrigins: config.trustedOrigins,
    database: drizzleAdapter(config.db, {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: { enabled: true },
    plugins: [username(), expo()],
    databaseHooks: {
      user: {
        create: {
          before: async () => {
            if (config.canSignUp && !(await config.canSignUp())) {
              throw new APIError("FORBIDDEN", { message: "Cadastro fechado nesta instância" });
            }
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth["$Infer"]["Session"];
export type AuthUser = AuthSession["user"];
