import { redirect } from "next/navigation";

import { getProfile } from "@/lib/db/profile";
import { ProfileSection } from "@/components/settings/profile-section";

export default async function SettingsProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return <ProfileSection profile={profile} />;
}
