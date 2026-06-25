// Pure metric computation for the entry form. No React, no locale, no DB.

import { convertCents, type Rates } from "./currency";

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
  breakEvenLead: MetricValue;
  stockDaysLeft: MetricValue;
};

const NULL = (kind: MetricKind, tone: MetricTone = "neutral"): MetricValue => ({
  value: null,
  kind,
  tone,
});

// Net profit in cents = revenue − sum of all cost cents. product_cost_cents
// and service_cost_cents are per-unit; they scale with `delivered`. Same
// formula used by computeMetrics and the trend chart's server-side
// aggregation.
export function computeNetProfitCents(
  e: Pick<
    MetricsInput,
    | "delivered"
    | "revenue_cents"
    | "ads_spend_cents"
    | "test_spend_cents"
    | "ad_account_cents"
    | "product_cost_cents"
    | "service_cost_cents"
    | "bonus_cents"
  >,
): number {
  return (
    e.revenue_cents -
    (e.ads_spend_cents +
      e.test_spend_cents +
      e.ad_account_cents +
      e.product_cost_cents * e.delivered +
      e.service_cost_cents * e.delivered +
      e.bonus_cents)
  );
}

type AggregatableEntry = Omit<MetricsInput, "daysElapsed">;

// Sums per-field across many entries. Per-unit costs (product_cost_cents,
// service_cost_cents) collapse into a weighted-by-delivered average so that
// downstream `computeMetrics(aggregated).totalSpend` recovers
// Σ(per_entry.cost × per_entry.delivered) correctly. Stock fields collapse
// to null because summing "initial_stock" across products has no meaningful
// interpretation.
export function aggregateEntries(
  entries: AggregatableEntry[],
): AggregatableEntry {
  const flat = entries.reduce(
    (acc, e) => ({
      leads: acc.leads + e.leads,
      orders: acc.orders + e.orders,
      delivered: acc.delivered + e.delivered,
      revenue_cents: acc.revenue_cents + e.revenue_cents,
      ads_spend_cents: acc.ads_spend_cents + e.ads_spend_cents,
      test_spend_cents: acc.test_spend_cents + e.test_spend_cents,
      ad_account_cents: acc.ad_account_cents + e.ad_account_cents,
      bonus_cents: acc.bonus_cents + e.bonus_cents,
      productContribution:
        acc.productContribution + e.product_cost_cents * e.delivered,
      serviceContribution:
        acc.serviceContribution + e.service_cost_cents * e.delivered,
    }),
    {
      leads: 0,
      orders: 0,
      delivered: 0,
      revenue_cents: 0,
      ads_spend_cents: 0,
      test_spend_cents: 0,
      ad_account_cents: 0,
      bonus_cents: 0,
      productContribution: 0,
      serviceContribution: 0,
    },
  );

  // Weighted-by-delivered average per-unit cost. When no units were
  // delivered, the contribution is zero anyway; setting the per-unit value
  // to zero keeps `computeMetrics` from producing NaN.
  const productPerUnit =
    flat.delivered > 0 ? flat.productContribution / flat.delivered : 0;
  const servicePerUnit =
    flat.delivered > 0 ? flat.serviceContribution / flat.delivered : 0;

  return {
    leads: flat.leads,
    orders: flat.orders,
    delivered: flat.delivered,
    revenue_cents: flat.revenue_cents,
    ads_spend_cents: flat.ads_spend_cents,
    test_spend_cents: flat.test_spend_cents,
    ad_account_cents: flat.ad_account_cents,
    product_cost_cents: productPerUnit,
    service_cost_cents: servicePerUnit,
    bonus_cents: flat.bonus_cents,
    initial_stock: null,
    current_stock: null,
  };
}

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

  // product_cost_cents and service_cost_cents are per-unit; they scale with
  // delivered to give the true cost contribution.
  const totalCosts =
    ads_spend_cents +
    test_spend_cents +
    ad_account_cents +
    product_cost_cents * delivered +
    service_cost_cents * delivered +
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

  // 4. Delivery rate = delivered / leads
  const deliveryRate: MetricValue =
    leads > 0
      ? {
          value: delivered / leads,
          kind: "percent",
          tone: toneFromBands(delivered / leads, {
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

  // 7. Profit per delivery = profit / delivered
  const epo: MetricValue =
    delivered > 0
      ? {
          value: profit / delivered,
          kind: "currency",
          tone: profit / delivered > 0 ? "good" : "bad",
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

  // 9. Break-even lead cost: max ads_spend per lead that keeps profit ≥ 0.
  // breakEvenAdsTotal = revenue − (all costs except ads)
  // breakEvenPerLead  = breakEvenAdsTotal / leads
  const breakEvenLead: MetricValue =
    leads > 0
      ? {
          value:
            (revenue_cents -
              (test_spend_cents +
                ad_account_cents +
                product_cost_cents * delivered +
                service_cost_cents * delivered +
                bonus_cents)) /
            leads,
          kind: "currency",
          tone: "neutral",
        }
      : NULL("currency");

  // 10. Stock units left = current_stock. Tone derived from implied days remaining.
  let stockDaysLeft: MetricValue = NULL("count");
  if (current_stock != null && current_stock >= 0) {
    let tone: MetricTone = "neutral";
    if (delivered > 0 && daysElapsed != null && daysElapsed > 0) {
      const dailyRate = delivered / daysElapsed;
      const days = current_stock / dailyRate;
      tone =
        days < 3
          ? "critical"
          : days < 7
            ? "bad"
            : days < 14
              ? "neutral"
              : "good";
    }
    stockDaysLeft = {
      value: current_stock,
      kind: "count",
      tone,
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
    breakEvenLead,
    stockDaysLeft,
  };
}

// ============================================================================
// Per-entry wrappers — apply sales_currency / costs_currency conversion at the
// boundary so the pure functions above stay currency-naive. Revenue is read
// in `sales_currency`; all cost fields are read in `costs_currency`. Both
// get converted to `baseCurrency` (the product's currency) before metrics
// run, which means all derived values are denominated in baseCurrency.
// ============================================================================

export type EntryCurrencies = {
  sales_currency: string;
  costs_currency: string;
};

export type EntryConversionCtx = {
  baseCurrency: string;
  rates: Rates;
};

type EntryForMetricsInput = Omit<
  MetricsInput,
  "daysElapsed"
> & EntryCurrencies;

function convertEntryToBase(
  e: EntryForMetricsInput,
  ctx: EntryConversionCtx,
): Omit<MetricsInput, "daysElapsed"> {
  const { baseCurrency, rates } = ctx;
  return {
    leads: e.leads,
    orders: e.orders,
    delivered: e.delivered,
    revenue_cents: convertCents(
      e.revenue_cents,
      e.sales_currency,
      baseCurrency,
      rates,
    ),
    ads_spend_cents: convertCents(
      e.ads_spend_cents,
      e.costs_currency,
      baseCurrency,
      rates,
    ),
    test_spend_cents: convertCents(
      e.test_spend_cents,
      e.costs_currency,
      baseCurrency,
      rates,
    ),
    ad_account_cents: convertCents(
      e.ad_account_cents,
      e.costs_currency,
      baseCurrency,
      rates,
    ),
    product_cost_cents: convertCents(
      e.product_cost_cents,
      e.costs_currency,
      baseCurrency,
      rates,
    ),
    service_cost_cents: convertCents(
      e.service_cost_cents,
      e.costs_currency,
      baseCurrency,
      rates,
    ),
    bonus_cents: convertCents(
      e.bonus_cents,
      e.costs_currency,
      baseCurrency,
      rates,
    ),
    initial_stock: e.initial_stock,
    current_stock: e.current_stock,
  };
}

export function computeMetricsForEntry(
  entry: EntryForMetricsInput & { daysElapsed: number | null },
  ctx: EntryConversionCtx,
): Metrics {
  const converted = convertEntryToBase(entry, ctx);
  return computeMetrics({ ...converted, daysElapsed: entry.daysElapsed });
}

export function computeNetProfitCentsForEntry(
  entry: Pick<
    MetricsInput,
    | "delivered"
    | "revenue_cents"
    | "ads_spend_cents"
    | "test_spend_cents"
    | "ad_account_cents"
    | "product_cost_cents"
    | "service_cost_cents"
    | "bonus_cents"
  > & EntryCurrencies,
  ctx: EntryConversionCtx,
): number {
  const { baseCurrency, rates } = ctx;
  return computeNetProfitCents({
    delivered: entry.delivered,
    revenue_cents: convertCents(
      entry.revenue_cents,
      entry.sales_currency,
      baseCurrency,
      rates,
    ),
    ads_spend_cents: convertCents(
      entry.ads_spend_cents,
      entry.costs_currency,
      baseCurrency,
      rates,
    ),
    test_spend_cents: convertCents(
      entry.test_spend_cents,
      entry.costs_currency,
      baseCurrency,
      rates,
    ),
    ad_account_cents: convertCents(
      entry.ad_account_cents,
      entry.costs_currency,
      baseCurrency,
      rates,
    ),
    product_cost_cents: convertCents(
      entry.product_cost_cents,
      entry.costs_currency,
      baseCurrency,
      rates,
    ),
    service_cost_cents: convertCents(
      entry.service_cost_cents,
      entry.costs_currency,
      baseCurrency,
      rates,
    ),
    bonus_cents: convertCents(
      entry.bonus_cents,
      entry.costs_currency,
      baseCurrency,
      rates,
    ),
  });
}
