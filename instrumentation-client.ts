import * as Sentry from "@sentry/nextjs";

// Browser SDK init. Next 15.3+ auto-loads this file in the client bundle.
// DSN missing in dev → init() becomes a no-op, no errors thrown.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance — keep low; bump if you actually look at traces.
  tracesSampleRate: 0.1,

  // Session replay — off by default to keep bundle small. Flip on later if
  // you wire @sentry/replay separately.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Don't ship debug noise in prod.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
