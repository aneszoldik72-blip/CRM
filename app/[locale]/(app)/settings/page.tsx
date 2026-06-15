import { getTranslations } from "next-intl/server";

import { SettingsListMobile } from "@/components/settings/settings-list-mobile";

// Mobile renders the iOS-style list. Desktop falls through to a simple hint
// because the inner sidebar already shows the sections; we don't redirect so
// /settings remains deep-linkable.
export default async function SettingsRootPage() {
  const t = await getTranslations("settings");

  return (
    <>
      <SettingsListMobile />
      <div className="hidden md:flex md:flex-col md:gap-2 md:rounded-xl md:border md:border-dashed md:border-border md:p-8 md:text-center md:text-sm md:text-muted-foreground">
        <p>{t("pickSection")}</p>
      </div>
    </>
  );
}
