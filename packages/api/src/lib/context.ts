import { type Auth, createAuth } from "@grimo/auth";
import { createDb, type Database } from "@grimo/db";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppEnv, Bindings } from "../env";

export const trustedOrigins = (env: Bindings) =>
  env.TRUSTED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

// Bindings are stable per isolate, so build db/auth once per isolate.
const services = new WeakMap<Bindings, { db: Database; auth: Auth }>();

function getServices(env: Bindings) {
  let cached = services.get(env);
  if (!cached) {
    const db = createDb(env.DB);
    const auth = createAuth({
      db,
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      trustedOrigins: trustedOrigins(env),
    });
    cached = { db, auth };
    services.set(env, cached);
  }
  return cached;
}

/** Injects `db`, `auth`, and the current `user`/`session` (or null). */
export const contextMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const { db, auth } = getServices(c.env);
  c.set("db", db);
  c.set("auth", auth);

  const result = c.req.path.startsWith("/api/auth/")
    ? null
    : await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", result?.user ?? null);
  c.set("session", result?.session ?? null);

  await next();
});

/** Returns the signed-in user or throws 401. Use at the top of protected handlers. */
export function requireUser(c: Context<AppEnv>) {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Não autenticado" });
  return user;
}
