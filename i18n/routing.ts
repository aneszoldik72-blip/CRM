import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "ar", "en"] as const,
  defaultLocale: "fr",
  localePrefix: "always",
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];

export const RTL_LOCALES: ReadonlySet<AppLocale> = new Set<AppLocale>(["ar"]);

// Map app locale to BCP-47 tag used by Intl.* APIs.
const BCP47: Record<AppLocale, string> = {
  fr: "fr-FR",
  ar: "ar-MA",
  en: "en-US",
};

export function bcp47(locale: AppLocale): string {
  return BCP47[locale];
}

export function isRtl(locale: AppLocale): boolean {
  return RTL_LOCALES.has(locale);
}
