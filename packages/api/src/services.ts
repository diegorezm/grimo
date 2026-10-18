import { type Auth, createAuth } from "@grimo/auth";
import type { InstanceInfo } from "@grimo/core";
import { type Database, user } from "@grimo/db";
import { sql } from "drizzle-orm";
import type { InstanceConfig } from "./config";
import type { Storage } from "./storage";

export interface AppServices {
  db: Database;
  auth: Auth;
  storage: Storage;
  config: InstanceConfig;
}

/**
 * Everything the API needs, built from runtime-specific pieces (db driver + storage).
 * Each runtime calls this once (per isolate on Workers, once on Node).
 */
export function createServices(input: {
  db: Database;
  storage: Storage;
  config: InstanceConfig;
}): AppServices {
  const { db, config } = input;
  const auth = createAuth({
    db,
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    trustedOrigins: [config.BETTER_AUTH_URL, ...config.TRUSTED_ORIGINS],
    canSignUp: () => isRegistrationOpen(db, config),
  });
  return { ...input, auth };
}

/** Personal instances accept exactly one account; community ones follow GRIMO_REGISTRATION. */
export async function isRegistrationOpen(db: Database, config: InstanceConfig) {
  if (config.GRIMO_MODE === "community") return config.GRIMO_REGISTRATION === "open";
  const row = await db.select({ count: sql<number>`count(*)` }).from(user).get();
  return Number(row?.count ?? 0) === 0;
}

export async function getInstanceInfo(db: Database, config: InstanceConfig): Promise<InstanceInfo> {
  return {
    name: config.GRIMO_INSTANCE_NAME,
    mode: config.GRIMO_MODE,
    registrationOpen: await isRegistrationOpen(db, config),
    social: config.GRIMO_MODE === "community",
  };
}
