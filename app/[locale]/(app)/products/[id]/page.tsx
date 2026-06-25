import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { Link, redirect } from "@/i18n/navigation";

import { getCountry } from "@/lib/data/countries";
import { getRates, type Rates } from "@/lib/currency";
import { listAgents } from "@/lib/db/agents";
import {
  listConfirmationsForProductOnDate,
  listConfirmationsForProductRange,
} from "@/lib/db/confirmations";
import { getEntry } from "@/lib/db/entries";
import {
  getMonthsWithEntries,
  getOrCreateCurrentMonth,
  listMonths,
  type MonthRow,
} from "@/lib/db/months";
import { getProduct } from "@/lib/db/products";
import { buildSnapshots, rankAgents } from "@/lib/agent-metrics";
import { computeNetProfitCentsForEntry } from "@/lib/metrics";
import { Badge } from "@/components/ui/badge";
import { EntryForm } from "@/components/entries/entry-form";
import { ConfirmationEntryForm } from "@/components/agents/confirmation-entry-form";
import { TopPerformersWidget } from "@/components/agents/top-performers-widget";
import type { TrendPoint } from "@/components/charts/profit-trend-chart";
import { MonthSwitcher } from "@/components/months/month-switcher";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; logDate?: string }>;
}) {
  const { id } = await params;
  const { month: monthParam, logDate: logDateParam } = await searchParams;
  const t = await getTranslations("products.detail");

  const product = await getProduct(id);
  if (!product) notFound();

  let months = await listMonths(id);
  if (months.length === 0) {
    const created = await getOrCreateCurrentMonth(id);
    months = [created];
  }

  let selected: MonthRow | undefined;
  if (monthParam) {
    selected = months.find((m) => m.id === monthParam);
    if (!selected) {
      // Invalid month param — drop it and land on newest.
      const locale = await getLocale();
      redirect({ href: `/products/${id}`, locale });
    }
  } else {
    selected = months[0];
  }

  if (!selected) {
    // Final safety net — auto-create rather than throw.
    selected = await getOrCreateCurrentMonth(id);
  }

  const country = getCountry(product.country);

  // Agent confirmation data for THIS product, scoped to the SELECTED
  // MonthSwitcher month. A brand-new month (no logs yet) renders an empty
  // widget and an empty entry form — there's no time-window in which old
  // confirmations from a previous month can leak in.
  const widgetRange = {
    start: selected.start_date,
    end: selected.end_date,
  };

  // Pick the day the entry form opens on. Prefer the URL param if it's
  // inside the selected month; else today if today is inside the selected
  // month; else the first day of the selected month.
  function pickLogDate(): string {
    if (
      logDateParam &&
      isIsoDate(logDateParam) &&
      logDateParam >= widgetRange.start &&
      logDateParam <= widgetRange.end
    ) {
      return logDateParam;
    }
    const today = todayIso();
    if (today >= widgetRange.start && today <= widgetRange.end) {
      return today;
    }
    return widgetRange.start;
  }
  const logDate = pickLogDate();

  const activeAgents = await listAgents("active");
  const allAgents = await listAgents("all");

  // listConfirmationsForProductRange runs:
  //   SELECT * FROM confirmations
  //   WHERE product_id = $1
  //     AND date >= $2 AND date <= $3
  // Both filters are required; RLS additionally scopes by user.
  const [monthConfirmations, todayConfirmations, monthEntry, rates] =
    await Promise.all([
      listConfirmationsForProductRange(product.id, {
        from: widgetRange.start,
        to: widgetRange.end,
      }),
      listConfirmationsForProductOnDate(product.id, logDate),
      getEntry(selected.id),
      getRates(),
    ]);

  const snapshotByAgent = buildSnapshots(
    activeAgents.map((a) => a.id),
    monthConfirmations,
    {
      currentFrom: widgetRange.start,
      currentTo: widgetRange.end,
      // Previous period not used by the compact widget — pass an
      // out-of-range window so all data lands in `current`.
      previousFrom: "0001-01-01",
      previousTo: "0001-01-02",
    },
  );

  const rankedForWidget = rankAgents(
    activeAgents.map((a) => ({
      agentId: a.id,
      current: snapshotByAgent[a.id]!.current,
      agent: a,
      snapshot: snapshotByAgent[a.id]!,
    })),
  )
    .slice(0, 3)
    .filter((r) => r.current.called > 0)
    .map((r) => ({ agent: r.agent, snapshot: r.snapshot }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/products"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("backToList")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {country && (
              <>
                <span aria-hidden>{country.flag}</span>
                <span>{country.code}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{product.currency}</span>
            {product.archived && (
              <Badge variant="secondary" className="ms-1">
                {t("archivedBadge")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <MonthSwitcher
        productId={product.id}
        months={months}
        selectedMonthId={selected.id}
      />

      <TopPerformersWidget
        productId={product.id}
        topAgents={rankedForWidget}
        hasAnyAgents={allAgents.length > 0}
      />

      <EntryForm
        key={selected.id}
        entry={monthEntry}
        month={selected}
        product={product}
        daysElapsed={daysElapsedFor(selected, new Date())}
        trendData={await buildTrendData(product.id, product.currency, rates)}
        rates={rates}
      />

      <ConfirmationEntryForm
        key={logDate}
        productId={product.id}
        agents={activeAgents}
        initialDate={logDate}
        initialConfirmations={todayConfirmations}
        minDate={widgetRange.start}
        maxDate={widgetRange.end}
        productLeads={monthEntry?.leads ?? null}
        productConfirmed={monthEntry?.orders ?? null}
      />
    </div>
  );
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function isIsoDate(s: string | undefined): s is string {
  return typeof s === "string" && ISO_DATE.test(s);
}
function todayIso(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

async function buildTrendData(
  productId: string,
  baseCurrency: string,
  rates: Rates,
): Promise<TrendPoint[]> {
  const rows = await getMonthsWithEntries(productId);
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    startDate: row.start_date,
    profitCents: row.entries
      ? computeNetProfitCentsForEntry(
          {
            delivered: row.entries.delivered,
            revenue_cents: row.entries.revenue_cents,
            ads_spend_cents: row.entries.ads_spend_cents,
            test_spend_cents: row.entries.test_spend_cents,
            ad_account_cents: row.entries.ad_account_cents,
            product_cost_cents: row.entries.product_cost_cents,
            service_cost_cents: row.entries.service_cost_cents,
            bonus_cents: row.entries.bonus_cents,
            sales_currency: row.entries.sales_currency,
            costs_currency: row.entries.costs_currency,
          },
          { baseCurrency, rates },
        )
      : 0,
  }));
}

// Days from a month's start through `today` (or the full month duration for
// past months). Returns null for future months. UTC-anchored to match the way
// month bounds are stored.
function daysElapsedFor(month: MonthRow, today: Date): number | null {
  const start = new Date(`${month.start_date}T00:00:00Z`);
  const end = new Date(`${month.end_date}T00:00:00Z`);
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  if (todayUtc < start) return null;
  const dayMs = 1000 * 60 * 60 * 24;
  if (todayUtc > end)
    return Math.round((end.getTime() - start.getTime()) / dayMs) + 1;
  return Math.round((todayUtc.getTime() - start.getTime()) / dayMs) + 1;
}
