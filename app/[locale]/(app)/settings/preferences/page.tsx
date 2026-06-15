import { redirect } from "next/navigation";

import { getProfile } from "@/lib/db/profile";
import { PreferencesSection } from "@/components/settings/preferences-section";

export default async function SettingsPreferencesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return <PreferencesSection profile={profile} />;
}
