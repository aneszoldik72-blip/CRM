"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";

export type NotFoundScreenProps = {
  fullscreen?: boolean;
  /** Where the "Back home" button points. Defaults to the dashboard. */
  backHref?: string;
};

// Use plain next/link with an explicit locale prefix rather than next-intl's
// localized Link. The locale prefix middleware redirects unprefixed URLs, so
// a hard-coded `/${locale}${backHref}` is always a valid client-side route
// and clicks navigate even if next-intl context is missing.
export function NotFoundScreen({
  fullscreen,
  backHref = "/dashboard",
}: NotFoundScreenProps) {
  const t = useTranslations("notFound");
  const locale = useLocale();
  const href = `/${locale}${backHref.startsWith("/") ? backHref : `/${backHref}`}`;

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-5 px-6 text-center",
        fullscreen ? "min-h-dvh justify-center py-10" : "py-16",
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="size-6" aria-hidden />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("body")}
        </p>
      </div>

      <Link
        href={href}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
