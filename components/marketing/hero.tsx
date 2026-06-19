import { getTranslations } from "next-intl/server";
import { ArrowRight, PlayCircle } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Screenshot } from "./screenshot";

export async function Hero() {
  const t = await getTranslations("marketing.hero");

  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Top radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center"
      >
        <div className="size-[700px] rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            {t("headline")}
          </h1>
          <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            {t("sub")}
          </p>
          <div className="mt-2 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01] hover:bg-primary/90"
            >
              {t("ctaPrimary")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 text-sm font-medium text-foreground/90 transition-colors hover:bg-white/[0.05]"
            >
              <PlayCircle className="size-4" aria-hidden />
              {t("ctaSecondary")}
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl sm:mt-20">
          <Screenshot alt={t("imageAlt")} ratio="wide" />
        </div>
      </div>
    </section>
  );
}
