import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../env";
import type { AppServices } from "../services";

/** Given the runtime's env (Worker bindings, or nothing on Node), returns the services. */
export type ServicesResolver = (env: unknown) => AppServices | Promise<AppServices>;

/** Injects services (`db`, `auth`, `storage`, `config`) and the current `user`/`session`. */
export const contextMiddleware = (resolve: ServicesResolver) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const services = await resolve(c.env);
    c.set("db", services.db);
    c.set("auth", services.auth);
    c.set("storage", services.storage);
    c.set("config", services.config);

    const result = c.req.path.startsWith("/api/auth/")
      ? null
      : await services.auth.api.getSession({ headers: c.req.raw.headers });
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

/** Throws 403 on personal instances (no follows / social features). */
export function requireSocial(c: Context<AppEnv>) {
  if (c.get("config").GRIMO_MODE !== "community") {
    throw new HTTPException(403, { message: "Recurso social desativado nesta instância" });
  }
}
