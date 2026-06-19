"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";

// Mobile-only "Back to Settings" link. The desktop sidebar (settings-nav)
// already provides this affordance, so we only render on small screens, and
// only when we're inside a sub-section (the bare /settings root would be
// pointing at itself).
export function SettingsBackLink() {
  const pathname = usePathname();
  const t = useTranslations("settingsBack");

  if (pathname === "/settings" || pathname === "/settings/") return null;

  return (
    <Link
      href="/settings"
      className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1.5 -ms-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
    >
      <ChevronLeft className="size-4 rtl:rotate-180" />
      {t("label")}
    </Link>
  );
}
