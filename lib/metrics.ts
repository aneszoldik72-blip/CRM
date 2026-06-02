// Pure metric computation for the entry form. No React, no locale, no DB.

export type MetricKind =
  | "currency"
  | "percent"
  | "multiplier"
  | "days"
  | "count";

export type MetricTone = "good" | "neutral" | "bad" | "critical";

export type MetricValue = {
  /** Internal numeric value. `null` means "cannot compute" — render as "—". */
  value: number | null;
  kind: MetricKind;
  tone: MetricTone;
};

export type MetricsInput = {
  leads: number;
  orders: number;
  delivered: number;
  revenue_cents: number;
  ads_spend_cents: number;
  test_spend_cents: number;
  ad_account_cents: number;
  product_cost_cents: number;
  service_cost_cents: number;
  bonus_cents: number;
  initial_stock: number | null;
  current_stock: number | null;
  /** Days from the month's start through the user's "today". `null` for
   * future months. `0` when today is the very first day of the month. */
  daysElapsed: number | null;
};

export type Metrics = {
  netProfit: MetricValue;
  roas: MetricValue;
  margin: MetricValue;
  deliveryRate: MetricValue;
  totalSpend: MetricValue;
  conversion: MetricValue;
  epo: MetricValue;
  costPerDelivered: MetricValue;
  avgRevenuePerOrder: MetricValue;
  avgRevenuePerDelivered: MetricValue;
  breakEvenLead: MetricValue;
  stockDaysLeft: MetricValue;
};

const NULL = (kind: MetricKind, tone: MetricTone = "neutral"): MetricValue => ({
  value: null,
  kind,
  tone,
});

function toneFromBands(
  value: number,
  bands: { good?: number; bad?: number; critical?: number },
): MetricTone {
  if (bands.critical != null && value < bands.critical) return "critical";
  if (bands.bad != null && value < bands.bad) return "bad";
  if (bands.good != null && value >= bands.good) return "good";
  return "neutral";
}

export function computeMetrics(input: MetricsInput): Metrics {
  const {
    leads,
    orders,
    delivered,
    revenue_cents,
    ads_spend_cents,
    test_spend_cents,
    ad_account_cents,
    product_cost_cents,
    service_cost_cents,
    bonus_cents,
    current_stock,
    daysElapsed,
  } = input;

  const totalCosts =
    ads_spend_cents +
    test_spend_cents +
    ad_account_cents +
    product_cost_cents +
    service_cost_cents +
    bonus_cents;

  const profit = revenue_cents - totalCosts;

  // 1. Net profit — always computable.
  const netProfit: MetricValue = {
    value: profit,
    kind: "currency",
    tone: profit > 0 ? "good" : profit < 0 ? "bad" : "neutral",
  };

  // 2. ROAS = revenue / ads_spend
  const roas: MetricValue =
    ads_spend_cents > 0
      ? {
          value: revenue_cents / ads_spend_cents,
          kind: "multiplier",
          tone: toneFromBands(revenue_cents / ads_spend_cents, {
            good: 2,
            bad: 1,
          }),
        }
      : NULL("multiplier");

  // 3. Margin = profit / revenue
  const margin: MetricValue =
    revenue_cents > 0
      ? {
          value: profit / revenue_cents,
          kind: "percent",
          tone: toneFromBands(profit / revenue_cents, {
            good: 0.2,
            bad: 0.1,
          }),
        }
      : NULL("percent");

  // 4. Delivery rate = delivered / orders
  const deliveryRate: MetricValue =
    orders > 0
      ? {
          value: delivered / orders,
          kind: "percent",
          tone: toneFromBands(delivered / orders, {
            good: 0.6,
            bad: 0.4,
          }),
        }
      : NULL("percent");

  // 5. Total spend — always.
  const totalSpend: MetricValue = {
    value: totalCosts,
    kind: "currency",
    tone: "neutral",
  };

  // 6. Conversion = orders / leads
  const conversion: MetricValue =
    leads > 0
      ? {
          value: orders / leads,
          kind: "percent",
          tone: toneFromBands(orders / leads, {
            good: 0.2,
            bad: 0.05,
          }),
        }
      : NULL("percent");

  // 7. EPO (earnings per order) = profit / orders
  const epo: MetricValue =
    orders > 0
      ? {
          value: profit / orders,
          kind: "currency",
          tone: profit / orders > 0 ? "good" : "bad",
        }
      : NULL("currency");

  // 8. Cost per delivered
  const costPerDelivered: MetricValue =
    delivered > 0
      ? {
          value: totalCosts / delivered,
          kind: "currency",
          tone: "neutral",
        }
      : NULL("currency");

  // 9. Avg revenue per order
  const avgRevenuePerOrder: MetricValue =
    orders > 0
      ? {
          value: revenue_cents / orders,
          kind: "currency",
          tone: "neutral",
        }
      : NULL("currency");

  // 10. Avg revenue per delivered
  const avgRevenuePerDelivered: MetricValue =
    delivered > 0
      ? {
          value: revenue_cents / delivered,
          kind: "currency",
          tone: "neutral",
        }
      : NULL("currency");

  // 11. Break-even lead cost: max ads_spend per lead that keeps profit ≥ 0.
  // breakEvenAdsTotal = revenue − (all costs except ads)
  // breakEvenPerLead  = breakEvenAdsTotal / leads
  const breakEvenLead: MetricValue =
    leads > 0
      ? {
          value:
            (revenue_cents -
              (test_spend_cents +
                ad_account_cents +
                product_cost_cents +
                service_cost_cents +
                bonus_cents)) /
            leads,
          kind: "currency",
          tone: "neutral",
        }
      : NULL("currency");

  // 12. Stock days left = current_stock / (delivered / daysElapsed)
  let stockDaysLeft: MetricValue = NULL("days");
  if (
    current_stock != null &&
    current_stock >= 0 &&
    delivered > 0 &&
    daysElapsed != null &&
    daysElapsed > 0
  ) {
    const dailyRate = delivered / daysElapsed;
    const days = current_stock / dailyRate;
    stockDaysLeft = {
      value: days,
      kind: "days",
      tone:
        days < 3
          ? "critical"
          : days < 7
            ? "bad"
            : days < 14
              ? "neutral"
              : "good",
    };
  }

  return {
    netProfit,
    roas,
    margin,
    deliveryRate,
    totalSpend,
    conversion,
    epo,
    costPerDelivered,
    avgRevenuePerOrder,
    avgRevenuePerDelivered,
    breakEvenLead,
    stockDaysLeft,
  };
}
