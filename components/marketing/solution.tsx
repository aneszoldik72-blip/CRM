import { getTranslations } from "next-intl/server";
import {
  BarChart3,
  Globe2,
  PackageSearch,
  ShoppingCart,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Screenshot } from "./screenshot";

const ITEMS = [
  { key: "profit", Icon: BarChart3 },
  { key: "agents", Icon: Users },
  { key: "products", Icon: ShoppingCart },
  { key: "stock", Icon: PackageSearch },
  { key: "multi", Icon: Globe2 },
] as const;

export async function Solution() {
  const t = await getTranslations("marketing.solution");

  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mx-auto max-w-2xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mt-16 flex flex-col gap-20 sm:gap-28">
          {ITEMS.map(({ key, Icon }, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={key}
                className={cn(
                  "grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12",
                )}
              >
                <div className={cn("flex flex-col gap-4", reversed && "md:order-2")}>
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                    {t(`items.${key}.body`)}
                  </p>
                </div>
                <div className={cn(reversed && "md:order-1")}>
                  <Screenshot alt={t(`items.${key}.alt`)} ratio="wide" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
