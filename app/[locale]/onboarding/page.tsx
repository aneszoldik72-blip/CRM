import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { getProfile } from "@/lib/db/profile";
import { isBaseCurrency, type BaseCurrency } from "@/lib/validators/profile";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const profile = await getProfile();
  const locale = await getLocale();
  if (!profile) {
    redirect({ href: "/login", locale });
    return null;
  }

  // Idempotent gate from the other side: if a user has already finished
  // onboarding, /onboarding sends them straight to the dashboard.
  if (profile.onboarding_complete) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const initialCurrency: BaseCurrency = isBaseCurrency(profile.default_currency)
    ? profile.default_currency
    : "USD";

  return (
    <OnboardingClient
      initialFullName={profile.full_name ?? ""}
      initialCountry={profile.country ?? ""}
      initialCurrency={initialCurrency}
    />
  );
}
