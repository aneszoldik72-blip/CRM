"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const FEATURES = ["products", "agents", "languages", "export", "support"] as const;

export function Pricing() {
  const t = useTranslations("marketing.pricing");
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const price = billing === "monthly" ? t("priceMonthly") : t("priceAnnual");
  const suffix =
    billing === "monthly" ? t("priceSuffixMonthly") : t("priceSuffixAnnual");

  return (
    <section id="pricing" className="relative overflow-hidden py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center"
      >
        <div className="size-[500px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Billing period"
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className={cn(
                "h-8 rounded-full px-4 text-sm font-medium transition-colors",
                billing === "monthly"
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("toggleMonthly")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === "annual"}
              onClick={() => setBilling("annual")}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                billing === "annual"
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("toggleAnnual")}
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {t("annualBadge")}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-10">
          <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 shadow-2xl shadow-primary/10">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-semibold tracking-tight">
                {price}
              </span>
              <span className="text-sm text-muted-foreground">{suffix}</span>
            </div>

            <ul className="mt-8 flex flex-col gap-3">
              {FEATURES.map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-3 text-sm text-foreground/90"
                >
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {t(`features.${key}`)}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01] hover:bg-primary/90"
            >
              {t("cta")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {t("terms")}
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("contactSales")}
          </p>
        </div>
      </div>
    </section>
  );
}
