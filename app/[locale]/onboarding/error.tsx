"use client";

import { useTranslations } from "next-intl";

import { ErrorScreen } from "@/components/shared/error-screen";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.screen");
  // Offer the dashboard as an escape hatch — the layout guard will bounce
  // them back to /onboarding unless onboarding_complete is true, but the
  // user might have hit reset() endlessly and we want a way out.
  return (
    <ErrorScreen
      error={error}
      reset={reset}
      secondaryHref="/"
      secondaryLabel={t("backHome")}
    />
  );
}
