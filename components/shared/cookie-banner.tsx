"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { optIn, optOut, readConsent } from "@/lib/analytics/posthog";

// Soft consent banner: analytics already runs anonymized by default. This
// banner appears once on first visit, lets the user opt out (sets a 12-month
// cookie). Once dismissed, never shown again.
export function CookieBanner() {
  const t = useTranslations("marketing.cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer so we don't show during the initial paint — feels less abrupt.
    const timer = window.setTimeout(() => {
      if (readConsent() === null) setVisible(true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  function handleAccept() {
    optIn();
    setVisible(false);
  }

  function handleReject() {
    optOut();
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label={t("aria")}
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:end-6 sm:bottom-6 sm:max-w-sm"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-background/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <p className="text-sm leading-relaxed text-foreground/90">
            {t("body")}
          </p>
          <button
            type="button"
            onClick={handleReject}
            aria-label={t("dismiss")}
            className="-me-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
