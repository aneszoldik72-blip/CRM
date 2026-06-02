"use client";

import { useMemo } from "react";
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
          label="Bénéfice net"
          formula="Chiffre d'affaires − Coûts"
          hint="CA − Coûts"
          value={metrics.netProfit}
          currency={currency}
        />
        <KpiCard
          variant="primary"
          label="ROAS"
          formula="Chiffre d'affaires / Dépenses pub"
          hint="CA / Pub"
          value={metrics.roas}
          currency={currency}
        />
        <KpiCard
          variant="primary"
          label="Marge"
          formula="Bénéfice net / Chiffre d'affaires"
          hint="Bénéfice / CA"
          value={metrics.margin}
          currency={currency}
        />
        <KpiCard
          variant="primary"
          label="Livraison"
          formula="Commandes livrées / Commandes"
          hint="Livrées / Cmd"
          value={metrics.deliveryRate}
          currency={currency}
        />
      </div>

      <Separator className="my-1" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          variant="secondary"
          label="Dépenses totales"
          formula="Somme de tous les coûts du mois"
          value={metrics.totalSpend}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="Conversion"
          formula="Commandes / Leads"
          value={metrics.conversion}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="EPO"
          formula="Bénéfice / Commandes"
          value={metrics.epo}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="Coût / livré"
          formula="Coûts totaux / Commandes livrées"
          value={metrics.costPerDelivered}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="Rev / Cmd"
          formula="Chiffre d'affaires / Commandes"
          value={metrics.avgRevenuePerOrder}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="Rev / livré"
          formula="Chiffre d'affaires / Commandes livrées"
          value={metrics.avgRevenuePerDelivered}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="Lead break-even"
          formula="Coût par lead maximum pour rester rentable"
          value={metrics.breakEvenLead}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="Stock — jours restants"
          formula="Stock actuel ÷ (Livrées / Jours écoulés)"
          value={metrics.stockDaysLeft}
          currency={currency}
        />
      </div>
    </section>
  );
}
