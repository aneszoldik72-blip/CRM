import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";

import { Screenshot } from "./screenshot";

const BULLETS = ["confirmation", "delivery", "profit"] as const;

export async function AgentDifferentiator() {
  const t = await getTranslations("marketing.agent");

  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-[#0a0a0c] py-24 sm:py-32">
      {/* Side glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-1/2 -z-10 size-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            VOIDCRAFT
          </span>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("body")}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <Screenshot alt={t("imageAlt")} ratio="wide" />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
            {BULLETS.map((key) => (
              <li key={key} className="inline-flex items-center gap-2 text-foreground/90">
                <Check className="size-4 text-primary" aria-hidden />
                {t(`bullets.${key}`)}
              </li>
            ))}
          </ul>
          <a
            href="#features"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-foreground/90 transition-colors hover:bg-white/[0.06]"
          >
            {t("cta")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
