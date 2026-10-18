import { INSTANCE_MODES, REGISTRATION_MODES } from "@grimo/core";
import { z } from "zod";

const list = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

/**
 * Instance configuration, read from environment variables on every runtime
 * (wrangler `vars`/secrets on Cloudflare, `process.env` on the Node server).
 * Documented in docs/self-hosting.md — keep both in sync.
 */
export const instanceConfigSchema = z.object({
  GRIMO_INSTANCE_NAME: z.string().default("Grimo"),
  GRIMO_MODE: z.enum(INSTANCE_MODES).default("community"),
  GRIMO_REGISTRATION: z.enum(REGISTRATION_MODES).default("open"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET precisa de 32+ caracteres"),
  BETTER_AUTH_URL: z.url(),
  /** Comma-separated: web origins + `grimo://` for the mobile app. */
  TRUSTED_ORIGINS: list,
});

export type InstanceConfig = z.infer<typeof instanceConfigSchema>;

/** Throws a readable error listing every invalid/missing variable. */
export function parseInstanceConfig(env: Record<string, unknown>): InstanceConfig {
  const result = instanceConfigSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Configuração inválida da instância:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
