"use client";

import posthog from "posthog-js";

// Soft-consent posture: PostHog initializes anonymously on first paint, no
// person profiles created until identify() is called. The cookie banner
// offers opt-out (sets posthog.opt_out_capturing() and a long-lived cookie).
//
// Init is idempotent — calling it twice is a no-op thanks to __loaded check.

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  // Respect prior opt-out before init (the SDK will pick this up via its own
  // cookie, but we double-check our own cookie too).
  if (typeof document !== "undefined" && hasOptedOut()) return;

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
    loaded: (ph) => {
      // Honor opt-out cookie immediately on (re-)load.
      if (hasOptedOut()) ph.opt_out_capturing();
    },
  });
  initialized = true;
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}

export const CONSENT_COOKIE = "voidcraft-analytics-consent";
// 12 months
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type ConsentValue = "accepted" | "opted-out";

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  const value = match.split("=")[1];
  return value === "accepted" || value === "opted-out" ? value : null;
}

export function writeConsent(value: ConsentValue) {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}

function hasOptedOut(): boolean {
  return readConsent() === "opted-out";
}

export function optOut() {
  writeConsent("opted-out");
  if (initialized) posthog.opt_out_capturing();
}

export function optIn() {
  writeConsent("accepted");
  if (!initialized) initAnalytics();
  else posthog.opt_in_capturing();
}
