"use client";

import { cn } from "@/lib/utils";
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

function formatRatesDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
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
  const profit = metrics.netProfit;

  const heroValue = !hasData
    ? "—"
    : profit.value === null
      ? `— ${currency}`
      : formatCurrency(profit.value, currency);

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
    <section aria-label="Totaux du mois" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {hasData
            ? "Bénéfice net ce mois"
            : "Pas encore de données pour ce mois"}
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
            {formatNumber(productCount)}{" "}
            {productCount > 1 ? "produits actifs" : "produit actif"} ·{" "}
            {formatNumber(orderCount)} commandes ·{" "}
            {formatNumber(deliveredCount)} livrées
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Totaux convertis en{" "}
          <span className="font-medium text-foreground">{currency}</span>
          {" · "}
          {ratesStale
            ? "taux indisponibles — totaux indicatifs"
            : ratesFetchedAt
              ? `taux mis à jour le ${formatRatesDate(ratesFetchedAt)}`
              : "taux mis à jour quotidiennement"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          variant="secondary"
          label="Chiffre d'affaires"
          formula="Somme du CA des produits"
          value={revenueMetric}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="Dépenses totales"
          formula="Somme des coûts des produits"
          value={metrics.totalSpend}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="Marge"
          formula="Bénéfice / CA"
          value={metrics.margin}
          currency={currency}
        />
        <KpiCard
          variant="secondary"
          label="ROAS"
          formula="CA / Pub"
          value={metrics.roas}
          currency={currency}
        />
      </div>
    </section>
  );
}
