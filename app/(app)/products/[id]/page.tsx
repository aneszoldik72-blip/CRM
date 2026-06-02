import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCountry } from "@/lib/data/countries";
import { getEntry } from "@/lib/db/entries";
import {
  getMonthsWithEntries,
  getOrCreateCurrentMonth,
  listMonths,
  type MonthRow,
} from "@/lib/db/months";
import { getProduct } from "@/lib/db/products";
import { computeNetProfitCents } from "@/lib/metrics";
import { Badge } from "@/components/ui/badge";
import { EntryForm } from "@/components/entries/entry-form";
import type { TrendPoint } from "@/components/charts/profit-trend-chart";
import { MonthSwitcher } from "@/components/months/month-switcher";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;

  const product = await getProduct(id);
  if (!product) notFound();

  let months = await listMonths(id);
  if (months.length === 0) {
    await getOrCreateCurrentMonth(id);
    months = await listMonths(id);
  }

  let selected: MonthRow | undefined;
  if (monthParam) {
    selected = months.find((m) => m.id === monthParam);
    if (!selected) {
      // Invalid month param — drop it and land on newest.
      redirect(`/products/${id}`);
    }
  } else {
    selected = months[0];
  }

  if (!selected) {
    // Should not happen given the auto-create above, but a defensive guard.
    throw new Error("Aucun mois disponible pour ce produit.");
  }

  const country = getCountry(product.country);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/products"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Produits
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
                Archivé
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

      <EntryForm
        key={selected.id}
        entry={await getEntry(selected.id)}
        month={selected}
        product={product}
        daysElapsed={daysElapsedFor(selected, new Date())}
        trendData={await buildTrendData(product.id)}
      />
    </div>
  );
}

async function buildTrendData(productId: string): Promise<TrendPoint[]> {
  const rows = await getMonthsWithEntries(productId);
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    startDate: row.start_date,
    profitCents: row.entries
      ? computeNetProfitCents({
          revenue_cents: row.entries.revenue_cents,
          ads_spend_cents: row.entries.ads_spend_cents,
          test_spend_cents: row.entries.test_spend_cents,
          ad_account_cents: row.entries.ad_account_cents,
          product_cost_cents: row.entries.product_cost_cents,
          service_cost_cents: row.entries.service_cost_cents,
          bonus_cents: row.entries.bonus_cents,
        })
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
