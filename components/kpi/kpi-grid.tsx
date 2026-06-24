"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useWatch, type Control } from "react-hook-form";

import { computeMetrics, type MetricsInput } from "@/lib/metrics";
import type { EntryValues } from "@/lib/validators/entry";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/kpi/kpi-card";

export type KpiGridProps = {
  control: Control<EntryValues>;
  currency: string;
  daysElapsed: number | null;
};

export function KpiGrid({ control, currency, daysElapsed }: KpiGridProps) {
  const t = useTranslations("metrics");
  const values = useWatch({ control }) as EntryValues;

  const metrics = useMemo(() => {
    const input: MetricsInput = {
      leads: values.leads ?? 0,
      orders: values.orders ?? 0,
      delivered: values.delivered ?? 0,
      revenue_cents: values.revenue_cents ?? 0,
      ads_spend_cents: values.ads_spend_cents ?? 0,
      test_spend_cents: values.test_spend_cents ?? 0,
      ad_account_cents: values.ad_account_cents ?? 0,
      product_cost_cents: values.product_cost_cents ?? 0,
      service_cost_cents: values.service_cost_cents ?? 0,
      bonus_cents: values.bonus_cents ?? 0,
      initial_stock: values.initial_stock,
      current_stock: values.current_stock,
      daysElapsed,
    };
    return computeMetrics(input);
  }, [values, daysElapsed]);

  return (
    <section aria-live="polite" className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          variant="primary"
          label={t("netProfit")}
          formula={t("netProfitFormula")}
          hint={t("netProfitHint")}
          value={metrics.netProfit}
          currency={currency}
        />
        <KpiCard
          variant="primary"
          label={t("roas")}
          formula={t("roasFormula")}
          hint={t("roasHint")}
          value={metrics.roas}
          currency={currency}
        />
        <KpiCard
          variant="primary"
          label={t("margin")}
          formula={t("marginFormula")}
          hint={t("marginHint")}
          value={metrics.margin}
          currency={currency}
        />
        <KpiCard
          variant="primary"
          label={t("delivery")}
          formula={t("deliveryFormula")}
          hint={t("deliveryHint")}
          value={metrics.deliveryRate}
          currency={currency}
        />
      </div>

      <Separator className="my-1" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          variant="secondary"
          label={t("totalSpend")}
          formula={t("totalSpendFormula")}
          value={metrics.totalSpend}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label={t("conversion")}
          formula={t("conversionFormula")}
          value={metrics.conversion}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label={t("epo")}
          formula={t("epoFormula")}
          value={metrics.epo}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label={t("costPerDelivered")}
          formula={t("costPerDeliveredFormula")}
          value={metrics.costPerDelivered}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label={t("breakEvenLead")}
          formula={t("breakEvenLeadFormula")}
          value={metrics.breakEvenLead}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label={t("stockDaysLeft")}
          formula={t("stockDaysLeftFormula")}
          value={metrics.stockDaysLeft}
          currency={currency}
        />
      </div>
    </section>
  );
}
