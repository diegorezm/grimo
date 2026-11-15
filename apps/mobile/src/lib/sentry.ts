import * as Sentry from "@sentry/react-native";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Error monitoring (legitimate interest, docs/legal/ropa.md): off without
 * `EXPO_PUBLIC_SENTRY_DSN`. No PII (no IP or user identity), no Session Replay: only the error,
 * its stack, native crashes and the breadcrumbs that led to it. Adding replay or a user id needs
 * the Privacy Policy first.
 */
Sentry.init({
  dsn: DSN,
  enabled: Boolean(DSN),
  environment: __DEV__ ? "development" : "production",
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    delete event.user;
    return event;
  },
});

export const captureError = Sentry.captureException;
export const withSentry = Sentry.wrap;
