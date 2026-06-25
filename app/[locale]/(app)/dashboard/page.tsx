import { after } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";

import { Separator } from "@/components/ui/separator";
import { convertCents, getRates, type Rates } from "@/lib/currency";
import { currentYyyymm } from "@/lib/date";
import { sendWelcome } from "@/lib/email/send";
import { claimWelcomeEmail, getProfile } from "@/lib/db/profile";
import {
  listProductsWithMonthSnapshot,
  type ProductWithMonthSnapshot,
} from "@/lib/db/products";
import {
  aggregateEntries,
  computeMetrics,
  computeMetricsForEntry,
  computeNetProfitCents,
} from "@/lib/metrics";
import { isBaseCurrency, type BaseCurrency } from "@/lib/validators/profile";
import { CurrencySwitcher } from "@/components/dashboard/currency-switcher";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { ExportDialog } from "@/components/dashboard/export-dialog";
import { WelcomeConfetti } from "@/components/onboarding/welcome-confetti";
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

// Converts every cents-valued field of an entry to the dashboard's base
// currency. Revenue is converted from sales_currency; all cost fields are
// converted from costs_currency (those two are per-entry, not per-product).
// Counts and stock pass through unchanged.
function convertEntry(
  entry: EntryNumbers,
  salesCurrency: string,
  costsCurrency: string,
  to: string,
  rates: Rates,
): EntryNumbers {
  return {
    ...entry,
    revenue_cents: convertCents(
      entry.revenue_cents,
      salesCurrency,
      to,
      rates,
    ),
    ads_spend_cents: convertCents(
      entry.ads_spend_cents,
      costsCurrency,
      to,
      rates,
    ),
    test_spend_cents: convertCents(
      entry.test_spend_cents,
      costsCurrency,
      to,
      rates,
    ),
    ad_account_cents: convertCents(
      entry.ad_account_cents,
      costsCurrency,
      to,
      rates,
    ),
    product_cost_cents: convertCents(
      entry.product_cost_cents,
      costsCurrency,
      to,
      rates,
    ),
    service_cost_cents: convertCents(
      entry.service_cost_cents,
      costsCurrency,
      to,
      rates,
    ),
    bonus_cents: convertCents(entry.bonus_cents, costsCurrency, to, rates),
  };
}

function toTableRow(p: ProductWithMonthSnapshot, rates: Rates): TableRow {
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
  // Row is displayed in the product's currency. Sales and costs are
  // converted from their entry-level currencies into the product currency
  // first so the per-product totals are honest.
  const m = computeMetricsForEntry(
    {
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
      sales_currency: p.entry.sales_currency,
      costs_currency: p.entry.costs_currency,
      daysElapsed: null,
    },
    { baseCurrency: p.currency, rates },
  );
  const revenueInProductCurrency = convertCents(
    p.entry.revenue_cents,
    p.entry.sales_currency,
    p.currency,
    rates,
  );
  return {
    id: p.id,
    name: p.name,
    country: p.country,
    currency: p.currency,
    hasEntry: true,
    revenueCents: revenueInProductCurrency,
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
  searchParams: Promise<{
    month?: string;
    currency?: string;
    welcome?: string;
  }>;
}) {
  const { month, currency, welcome } = await searchParams;
  const yyyymm = parseMonthOrCurrent(month);
  const t = await getTranslations("dashboard");
  const showConfetti = welcome === "1";

  const [snapshot, profile, rates] = await Promise.all([
    listProductsWithMonthSnapshot(yyyymm),
    getProfile(),
    getRates(),
  ]);

  // Welcome email — at-most-once per user, mathematically guaranteed.
  //
  // The previous "check → send → mark" sequence was racy: under concurrent
  // dashboard renders (Next.js prefetch, parallel server-component fetches,
  // post-signup redirects) every render would read welcome_email_sent_at as
  // NULL, see "first visit", and enqueue its own send. Result: 6-7 emails.
  //
  // The fast-path skip avoids a DB write on every visit after the flag is
  // set. The atomic claim is the source of truth — if profile.welcome_email_
  // sent_at is stale (e.g. another render flipped it microseconds ago),
  // claimWelcomeEmail() will return false and we won't send.
  if (profile && !profile.welcome_email_sent_at) {
    const claimed = await claimWelcomeEmail();
    if (claimed) {
      const locale = await getLocale();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const dashboardUrl = `${siteUrl}/${locale}/dashboard`;
      const firstName = profile.full_name?.split(" ")[0];
      console.log("[welcome-email] claimed, scheduling send", {
        to: profile.email,
        firstName,
      });
      after(async () => {
        const result = await sendWelcome(profile.email, { firstName, dashboardUrl });
        if (!result.sent) {
          // At-most-once: don't unclaim. If the send fails, the user just
          // doesn't get the email. Reset welcome_email_sent_at to NULL in
          // the DB by hand if you want to retry for a specific user.
          console.error(
            "[welcome-email] CLAIMED but send failed — NOT retrying",
            result,
          );
        } else {
          console.log("[welcome-email] sent for", profile.email);
        }
      });
    } else {
      console.log(
        "[welcome-email] another render already claimed this user, skipping",
      );
    }
  }

  const baseCurrency = resolveBaseCurrency(
    currency,
    profile?.default_currency,
  );

  if (snapshot.length === 0) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-6 md:px-8">
        {showConfetti && <WelcomeConfetti />}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <div className="flex items-center gap-2">
            <GlobalMonthPicker selected={yyyymm} />
          </div>
        </header>
        <div className="flex justify-center">
          <CurrencySwitcher selected={baseCurrency} />
        </div>
        <DashboardEmptyState />
      </main>
    );
  }

  // Strip the joined month/entry to satisfy ExportDialog's ProductRow prop.
  const productsForExport = snapshot.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    name: p.name,
    country: p.country,
    currency: p.currency,
    image_url: p.image_url,
    archived: p.archived,
    created_at: p.created_at,
  }));

  const allWithData = snapshot.filter((p) => p.entry);
  const noDataCount = snapshot.filter((p) => !p.entry).length;

  // Convert every product's entry into the dashboard base currency BEFORE
  // aggregating so the totals are honest across currencies. Each entry now
  // carries its own sales_currency and costs_currency, which take precedence
  // over the product's currency for the actual money values.
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
      p.entry!.sales_currency,
      p.entry!.costs_currency,
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

  const tableRows: TableRow[] = snapshot.map((p) => toTableRow(p, rates));

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
      {showConfetti && <WelcomeConfetti />}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <GlobalMonthPicker selected={yyyymm} />
          <ExportDialog
            products={productsForExport}
            baseCurrency={baseCurrency}
          />
        </div>
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
