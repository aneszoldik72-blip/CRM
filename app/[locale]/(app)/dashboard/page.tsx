import { getTranslations } from "next-intl/server";

import { Separator } from "@/components/ui/separator";
import { convertCents, getRates, type Rates } from "@/lib/currency";
import { currentYyyymm } from "@/lib/date";
import { getProfile } from "@/lib/db/profile";
import {
  listProductsWithMonthSnapshot,
  type ProductWithMonthSnapshot,
} from "@/lib/db/products";
import {
  aggregateEntries,
  computeMetrics,
  computeNetProfitCents,
} from "@/lib/metrics";
import { isBaseCurrency, type BaseCurrency } from "@/lib/validators/profile";
import { CurrencySwitcher } from "@/components/dashboard/currency-switcher";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import {
  FunnelComparisonChart,
  type FunnelRow,
} from "@/components/dashboard/funnel-comparison-chart";
import { GlobalMonthPicker } from "@/components/dashboard/global-month-picker";
import {
  ProfitLossChart,
  type ProfitRow,
} from "@/components/dashboard/profit-loss-chart";
import {
  ProductsTable,
  type TableRow,
  type TotalsRow,
} from "@/components/dashboard/products-table";
import { TotalsGrid } from "@/components/dashboard/totals-grid";

const YYYYMM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function parseMonthOrCurrent(input: string | undefined): string {
  if (input && YYYYMM_RE.test(input)) return input;
  return currentYyyymm();
}

type EntryNumbers = {
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
};

// Converts every cents-valued field of an entry from `from` → `to`.
// Counts (leads/orders/delivered) and stock pass through unchanged.
function convertEntry(
  entry: EntryNumbers,
  from: string,
  to: string,
  rates: Rates,
): EntryNumbers {
  if (from === to) return entry;
  return {
    ...entry,
    revenue_cents: convertCents(entry.revenue_cents, from, to, rates),
    ads_spend_cents: convertCents(entry.ads_spend_cents, from, to, rates),
    test_spend_cents: convertCents(entry.test_spend_cents, from, to, rates),
    ad_account_cents: convertCents(entry.ad_account_cents, from, to, rates),
    product_cost_cents: convertCents(
      entry.product_cost_cents,
      from,
      to,
      rates,
    ),
    service_cost_cents: convertCents(
      entry.service_cost_cents,
      from,
      to,
      rates,
    ),
    bonus_cents: convertCents(entry.bonus_cents, from, to, rates),
  };
}

function toTableRow(p: ProductWithMonthSnapshot): TableRow {
  if (!p.entry) {
    return {
      id: p.id,
      name: p.name,
      country: p.country,
      currency: p.currency,
      hasEntry: false,
      revenueCents: 0,
      spendCents: 0,
      profitCents: 0,
      margin: null,
      roas: null,
      deliveryRate: null,
    };
  }
  const m = computeMetrics({
    leads: p.entry.leads,
    orders: p.entry.orders,
    delivered: p.entry.delivered,
    revenue_cents: p.entry.revenue_cents,
    ads_spend_cents: p.entry.ads_spend_cents,
    test_spend_cents: p.entry.test_spend_cents,
    ad_account_cents: p.entry.ad_account_cents,
    product_cost_cents: p.entry.product_cost_cents,
    service_cost_cents: p.entry.service_cost_cents,
    bonus_cents: p.entry.bonus_cents,
    initial_stock: p.entry.initial_stock,
    current_stock: p.entry.current_stock,
    daysElapsed: null,
  });
  return {
    id: p.id,
    name: p.name,
    country: p.country,
    currency: p.currency,
    hasEntry: true,
    revenueCents: p.entry.revenue_cents,
    spendCents: m.totalSpend.value ?? 0,
    profitCents: m.netProfit.value ?? 0,
    margin: m.margin.value,
    roas: m.roas.value,
    deliveryRate: m.deliveryRate.value,
  };
}

function resolveBaseCurrency(
  urlValue: string | undefined,
  profileValue: string | null | undefined,
): BaseCurrency {
  if (isBaseCurrency(urlValue)) return urlValue;
  if (isBaseCurrency(profileValue)) return profileValue;
  return "USD";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; currency?: string }>;
}) {
  const { month, currency } = await searchParams;
  const yyyymm = parseMonthOrCurrent(month);
  const t = await getTranslations("dashboard");

  const [snapshot, profile, rates] = await Promise.all([
    listProductsWithMonthSnapshot(yyyymm),
    getProfile(),
    getRates(),
  ]);

  const baseCurrency = resolveBaseCurrency(
    currency,
    profile?.default_currency,
  );

  if (snapshot.length === 0) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-6 md:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <GlobalMonthPicker selected={yyyymm} />
        </header>
        <div className="flex justify-center">
          <CurrencySwitcher selected={baseCurrency} />
        </div>
        <DashboardEmptyState />
      </main>
    );
  }

  const allWithData = snapshot.filter((p) => p.entry);
  const noDataCount = snapshot.filter((p) => !p.entry).length;

  // Convert every product's entry into the base currency BEFORE aggregating
  // so the totals are honest across currencies.
  const convertedEntries = allWithData.map((p) =>
    convertEntry(
      {
        leads: p.entry!.leads,
        orders: p.entry!.orders,
        delivered: p.entry!.delivered,
        revenue_cents: p.entry!.revenue_cents,
        ads_spend_cents: p.entry!.ads_spend_cents,
        test_spend_cents: p.entry!.test_spend_cents,
        ad_account_cents: p.entry!.ad_account_cents,
        product_cost_cents: p.entry!.product_cost_cents,
        service_cost_cents: p.entry!.service_cost_cents,
        bonus_cents: p.entry!.bonus_cents,
        initial_stock: p.entry!.initial_stock,
        current_stock: p.entry!.current_stock,
      },
      p.currency,
      baseCurrency,
      rates,
    ),
  );

  const aggregated = aggregateEntries(convertedEntries);
  const metrics = computeMetrics({ ...aggregated, daysElapsed: null });

  const profitRows: ProfitRow[] = allWithData
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      country: p.country,
      profitCents: computeNetProfitCents(convertedEntries[i]!),
    }))
    .sort((a, b) => b.profitCents - a.profitCents);

  const funnelRows: FunnelRow[] = snapshot
    .filter((p) => p.entry)
    .map((p) => ({
      id: p.id,
      name: p.name,
      country: p.country,
      leads: p.entry!.leads,
      orders: p.entry!.orders,
      delivered: p.entry!.delivered,
    }))
    .sort(
      (a, b) =>
        b.leads + b.orders + b.delivered - (a.leads + a.orders + a.delivered),
    );

  const tableRows: TableRow[] = snapshot.map(toTableRow);

  const totalsRow: TotalsRow = {
    currency: baseCurrency,
    revenueCents: aggregated.revenue_cents,
    spendCents: metrics.totalSpend.value ?? 0,
    profitCents: metrics.netProfit.value ?? 0,
    margin: metrics.margin.value,
    roas: metrics.roas.value,
    deliveryRate: metrics.deliveryRate.value,
  };

  const hasData = allWithData.length > 0;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-6 md:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <GlobalMonthPicker selected={yyyymm} />
      </header>
      <div className="flex justify-center">
        <CurrencySwitcher selected={baseCurrency} />
      </div>

      <TotalsGrid
        metrics={metrics}
        revenueCents={aggregated.revenue_cents}
        currency={baseCurrency}
        productCount={allWithData.length}
        orderCount={aggregated.orders}
        deliveredCount={aggregated.delivered}
        hasData={hasData}
        ratesStale={rates.stale}
        ratesFetchedAt={rates.fetchedAt}
      />

      <Separator />

      <ProfitLossChart products={profitRows} currency={baseCurrency} />

      <Separator />

      <FunnelComparisonChart products={funnelRows} />

      <Separator />

      <ProductsTable rows={tableRows} totals={totalsRow} />

      {noDataCount > 0 && (
        <footer className="pb-6 text-xs text-muted-foreground">
          {t("noDataFooter", { count: noDataCount })}
        </footer>
      )}
    </main>
  );
}
