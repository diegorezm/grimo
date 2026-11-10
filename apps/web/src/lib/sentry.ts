import * as Sentry from "@sentry/react";
import type { AnyRouter } from "@tanstack/react-router";

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/**
 * Error monitoring (legitimate interest, docs/legal/ropa.md): off without `VITE_SENTRY_DSN`.
 * No PII (no IP, cookies, headers, user identity or query strings, which can carry tokens like
 * the password reset one), no Session Replay: only the error, its stack and the breadcrumbs that
 * led to it. Adding replay or a user id needs the Privacy Policy first.
 */
export function initSentry(router: AnyRouter) {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: 0.1,
    beforeSend(event) {
      delete event.user;
      if (event.request?.url) event.request.url = stripQuery(event.request.url);
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      for (const key of ["url", "from", "to"]) {
        const value = breadcrumb.data?.[key];
        if (typeof value === "string") breadcrumb.data![key] = stripQuery(value);
      }
      return breadcrumb;
    },
  });
}

function stripQuery(url: string) {
  return url.split(/[?#]/)[0];
}

export const captureError = Sentry.captureException;
