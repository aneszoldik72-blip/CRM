import { getTranslations } from "next-intl/server";
import { FileSpreadsheet, TrendingDown, Users } from "lucide-react";

import { Screenshot } from "./screenshot";

const ITEMS = [
  { key: "chaos", Icon: FileSpreadsheet },
  { key: "agents", Icon: Users },
  { key: "profit", Icon: TrendingDown },
] as const;

export async function Problem() {
  const t = await getTranslations("marketing.problem");

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mx-auto max-w-2xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {ITEMS.map(({ key, Icon }) => (
            <div
              key={key}
              className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.015] p-6 transition-colors hover:bg-white/[0.03]"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-lg font-semibold tracking-tight">
                {t(`items.${key}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`items.${key}.body`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t("beforeAfter.before")}
            </span>
            <Screenshot alt={t("beforeAfter.before")} ratio="card" variant="dim" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("beforeAfter.after")}
            </span>
            <Screenshot alt={t("beforeAfter.after")} ratio="card" />
          </div>
        </div>
      </div>
    </section>
  );
}
