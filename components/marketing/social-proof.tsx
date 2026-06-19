import { getTranslations } from "next-intl/server";

export async function SocialProof() {
  const t = await getTranslations("marketing.socialProof");

  return (
    <section className="border-y border-white/5 bg-white/[0.015]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-6 text-center sm:flex-row sm:justify-center sm:gap-6 sm:px-6">
        <p className="text-sm font-medium text-foreground/90">{t("line")}</p>
        <span aria-hidden className="hidden text-muted-foreground/40 sm:inline">
          ·
        </span>
        <p className="text-xs text-muted-foreground">{t("hosting")}</p>
      </div>
    </section>
  );
}
