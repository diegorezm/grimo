import { type AppServices, createApp, createServices, parseInstanceConfig } from "@grimo/api";
import { createD1Db } from "@grimo/db/d1";
import { createR2Storage } from "./r2-storage";

// Cloudflare runtime. All routes live in packages/api; this file only wires D1 + R2.
// Bindings are stable per isolate, so services are built once per isolate.
const cache = new WeakMap<Env, AppServices>();

function servicesFor(env: Env) {
  let services = cache.get(env);
  if (!services) {
    services = createServices({
      // workers-types (packages) vs generated runtime types (here) differ only nominally.
      db: createD1Db(env.DB as never),
      storage: createR2Storage(env.MEDIA),
      config: parseInstanceConfig(env as unknown as Record<string, unknown>),
    });
    cache.set(env, services);
  }
  return services;
}

export default createApp((env) => servicesFor(env as Env));
