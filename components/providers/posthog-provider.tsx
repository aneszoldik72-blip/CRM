"use client";

import { useEffect } from "react";

import { initAnalytics } from "@/lib/analytics/posthog";

// Top-level mount point for the analytics SDK. Runs on every page (mounted
// inside the locale layout). Init is idempotent and a no-op if the user has
// previously opted out, so this is safe to mount unconditionally.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return <>{children}</>;
}
