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
  /** Sign in with Apple (Services ID + client secret JWT). Both unset = Apple disabled. */
  APPLE_CLIENT_ID: vars.APPLE_CLIENT_ID,
  APPLE_CLIENT_SECRET: vars.APPLE_CLIENT_SECRET,
  /** The iOS app's bundle id, for native Sign in with Apple. */
  APPLE_BUNDLE_ID: vars.APPLE_BUNDLE_ID,
  /** Transactional email (Resend): password reset and email verification. Unset = disabled. */
  RESEND_API_KEY: vars.RESEND_API_KEY,
  /** Sender, e.g. `Grimo <ola@grimo.app>` (a domain verified in Resend). */
  EMAIL_FROM: vars.EMAIL_FROM,
};

/**
 * Whether the deployment can send email. Only then is a verified email required for the social
 * features (comment, post, like, follow): without a way to send the link, nobody could verify.
 */
export const emailEnabled = () => Boolean(vars.RESEND_API_KEY && vars.EMAIL_FROM);
