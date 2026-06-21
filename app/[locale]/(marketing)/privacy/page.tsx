import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-static";
export const revalidate = false;

const SECTIONS = [
  "collected",
  "hosting",
  "subprocessors",
  "retention",
  "rights",
  "cookies",
  "analytics",
  "contact",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.privacy" });
  return { title: t("title") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing.privacy");

  return (
    <article className="mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
      <header className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
          {t("draft")}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("lastUpdated")}</p>
      </header>

      <p className="mt-8 text-base leading-relaxed text-foreground/90">
        {t("intro")}
      </p>

      <div className="mt-12 flex flex-col gap-10">
        {SECTIONS.map((key) => (
          <section key={key} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {t(`sections.${key}.title`)}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`sections.${key}.body`)}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
