"use client";

import { useTranslations } from "next-intl";
import { Boxes, type LucideIcon } from "lucide-react";

export type ComingSoonProps = {
  /** Translation namespace whose `title` and `body` keys describe the page. */
  namespace: string;
  /** Icon shown in the rounded square. Defaults to a generic box. */
  icon?: LucideIcon;
};

// Empty-state used for routes that exist in the nav but aren't shipped
// yet. Same visual rhythm as DashboardEmptyState.
export function ComingSoon({ namespace, icon: Icon = Boxes }: ComingSoonProps) {
  const t = useTranslations(namespace);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-8 flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-10" aria-hidden />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("body")}
      </p>
      <span className="mt-7 rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {t("badge")}
      </span>
    </div>
  );
}
