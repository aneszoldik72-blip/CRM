"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export function DashboardEmptyState() {
  const t = useTranslations("dashboard");
  return (
    <div
      data-testid="dashboard-empty-state"
      className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center"
    >
      <div className="mb-8 flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Plus className="size-10" aria-hidden />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">{t("welcome")}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("addFirstProduct")}
      </p>
      {/* Plain anchor with button-look styling. `<Button render={<Link/>}>`
          tripped base-ui's nativeButton check and produced an empty CTA. */}
      <Link
        href="/products"
        className={cn(
          buttonVariants({ variant: "default" }),
          "mt-7 h-11 gap-2 px-5 text-sm",
        )}
      >
        <Plus className="size-4" />
        {t("addProductCta")}
      </Link>
    </div>
  );
}
