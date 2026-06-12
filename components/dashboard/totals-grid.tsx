"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { bcp47, type AppLocale } from "@/i18n/routing";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Metrics, MetricValue } from "@/lib/metrics";
import { KpiCard } from "@/components/kpi/kpi-card";

export type TotalsGridProps = {
  metrics: Metrics;
  revenueCents: number;
  currency: string;
  productCount: number;
  orderCount: number;
  deliveredCount: number;
  hasData: boolean;
  ratesStale?: boolean;
  ratesFetchedAt?: string;
};

function formatRatesDate(iso: string | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
  }).format(d);
}

export function TotalsGrid({
  metrics,
  revenueCents,
  currency,
  productCount,
  orderCount,
  deliveredCount,
  hasData,
  ratesStale,
  ratesFetchedAt,
}: TotalsGridProps) {
  const t = useTranslations("dashboard");
  const tMetrics = useTranslations("metrics");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);
  const profit = metrics.netProfit;

  const heroValue = !hasData
    ? "—"
    : profit.value === null
      ? `— ${currency}`
      : formatCurrency(profit.value, currency, bcp);

  const heroPrefix =
    hasData && profit.value !== null && profit.value > 0
      ? "▲ "
      : hasData && profit.value !== null && profit.value < 0
        ? "▼ "
        : "";

  const revenueMetric: MetricValue = {
    value: hasData ? revenueCents : null,
    kind: "currency",
    tone: "neutral",
  };

  return (
    <section aria-label={t("totalsOfMonth")} className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {hasData ? t("netProfitThisMonth") : t("noDataForMonth")}
        </p>
        <p
          className={cn(
            "text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl",
            hasData &&
              profit.value !== null &&
              profit.value > 0 &&
              "text-emerald-500",
            hasData &&
              profit.value !== null &&
              profit.value < 0 &&
              "text-destructive",
          )}
        >
          {heroPrefix}
          {heroValue}
        </p>
        {hasData && (
          <p className="text-sm text-muted-foreground">
            {t("productsActive", { count: productCount })} ·{" "}
            {t("orders", { count: formatNumber(orderCount, bcp) })} ·{" "}
            {t("delivered", { count: formatNumber(deliveredCount, bcp) })}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t("convertedTo")}{" "}
          <span className="font-medium text-foreground">{currency}</span>
          {" · "}
          {ratesStale
            ? t("ratesStale")
            : ratesFetchedAt
              ? t("ratesUpdatedOn", {
                  date: formatRatesDate(ratesFetchedAt, bcp),
                })
              : t("ratesUpdatedDaily")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          variant="secondary"
          label={tMetrics("revenue")}
          formula={tMetrics("revenueFormula")}
          value={revenueMetric}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label={tMetrics("totalSpend")}
          formula={tMetrics("totalSpendDashboardFormula")}
          value={metrics.totalSpend}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label={tMetrics("margin")}
          formula={tMetrics("marginHint")}
          value={metrics.margin}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label={tMetrics("roas")}
          formula={tMetrics("roasHint")}
          value={metrics.roas}
          currency={currency}
        />
      </div>
    </section>
  );
}
