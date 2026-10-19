/**
 * Deployment environment variables (`npx convex env set NAME value`). Read through
 * `globalThis` so clients, which typecheck these modules via `api`, need no Node types.
 */
const vars = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;

export const env = {
  /** The web app's origin, e.g. http://localhost:5173 (auth redirects + CORS). */
  SITE_URL: vars.SITE_URL ?? "http://localhost:5173",
  /** Set by Convex: this deployment's HTTP actions URL (where /api/auth lives). */
  CONVEX_SITE_URL: vars.CONVEX_SITE_URL,
  /** Google sign-in (OAuth client from Google Cloud). Both unset = Google sign-in disabled. */
  GOOGLE_CLIENT_ID: vars.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: vars.GOOGLE_CLIENT_SECRET,
};
