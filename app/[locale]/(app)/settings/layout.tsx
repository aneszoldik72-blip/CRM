import { getTranslations } from "next-intl/server";

import { SettingsBackLink } from "@/components/settings/settings-back-link";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("settings");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-1 md:hidden">
        <SettingsBackLink />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </header>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <SettingsNav />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
