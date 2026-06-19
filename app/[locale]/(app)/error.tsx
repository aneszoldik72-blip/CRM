"use client";

import { ErrorScreen } from "@/components/shared/error-screen";

// Boundary for everything inside the app shell (dashboard, products,
// agents, settings, stock). The shell layout above keeps rendering — only
// the page content swaps for the error UI.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen error={error} reset={reset} />;
}
