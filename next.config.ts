import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// CSP — kept in report-only mode for now (per S19 plan). Watch reports
// arriving at /api/csp-report for ~1 week, then flip to enforced by renaming
// the header key to "Content-Security-Policy".
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-eval' required by PostHog autocapture + Sentry replay; remove
  // once those features are off or proven optional.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://*.posthog.com https://us-assets.i.posthog.com https://browser.sentry-cdn.com https://js.sentry-cdn.com",
  "script-src-elem 'self' 'unsafe-inline' https://*.stripe.com https://*.posthog.com https://us-assets.i.posthog.com https://browser.sentry-cdn.com https://js.sentry-cdn.com",
  // Tailwind generates inline-style attributes via CSS variables; next/font
  // google fetches stylesheets from fonts.googleapis.com.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.ingest.sentry.io https://*.sentry.io https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.upstash.io",
  "frame-src 'self' https://*.stripe.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "report-uri /api/csp-report",
].join("; ");

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: CSP_DIRECTIVES },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

const SENTRY_OPTIONS = {
  // Suppress all logs unless we're in CI.
  silent: !process.env.CI,
  // Source-map upload requires SENTRY_AUTH_TOKEN at build time. Without it
  // Sentry just skips upload silently — no errors, no thrown build.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Avoid widening source-map exposure to the browser.
  hideSourceMaps: true,
  // Tree-shake Sentry logger statements in prod.
  disableLogger: true,
};

export default withSentryConfig(withNextIntl(nextConfig), SENTRY_OPTIONS);
