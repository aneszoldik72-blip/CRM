"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";

import { routing, type AppLocale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

const SHORT_LABELS: Record<AppLocale, string> = {
  fr: "FR",
  ar: "ع",
  en: "EN",
};

export function LanguageSwitcher() {
  const current = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: AppLocale) {
    if (next === current) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
      {routing.locales.map((code, i) => (
        <span key={code} className="flex items-center gap-3">
          {i > 0 && <span className="opacity-40">·</span>}
          <button
            type="button"
            disabled={pending}
            onClick={() => switchTo(code)}
            aria-current={current === code ? "true" : undefined}
            className={
              "transition-colors hover:text-foreground " +
              (current === code ? "text-foreground" : "")
            }
          >
            {SHORT_LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  );
}
