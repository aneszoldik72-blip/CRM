// Pure CSV builder for dashboard exports. No React, no Supabase. The route
// handler does data fetching and currency conversion, then hands rows here.

import Papa from "papaparse";

import { formatMonthLabel } from "../date";
import { computeMetrics, type MetricsInput } from "../metrics";

export type ExportInclude = "kpis" | "full";

// Header strings live in English regardless of UI locale.
export const FULL_COLUMNS = [
  "Product",
  "Month",
  "Currency",
  "Leads",
  "Confirmed",
  "Delivered",
  "Revenue",
  "Total Spend",
  "Net Profit",
  "ROAS",
  "Margin %",
  "Delivery Rate",
  "Profit per delivery",
] as const;

export const KPI_COLUMNS = [
  "Product",
  "Month",
  "Currency",
  "Revenue",
  "Total Spend",
  "Net Profit",
  "Margin %",
  "ROAS",
] as const;

export type ExportRow = Record<(typeof FULL_COLUMNS)[number], string | number | null>;

export type BuildRowInput = {
  productName: string;
  /** YYYY-MM. Used to format the Month column. */
  yyyymm: string;
  /** Currency code emitted in the Currency column (already the target). */
  currency: string;
  /** Entry numbers, with all cents fields already converted to `currency`. */
  entry: Pick<
    MetricsInput,
    | "leads"
    | "orders"
    | "delivered"
    | "revenue_cents"
    | "ads_spend_cents"
    | "test_spend_cents"
    | "ad_account_cents"
    | "product_cost_cents"
    | "service_cost_cents"
    | "bonus_cents"
  > | null;
};

const NULL_NUM = (): null => null;

// Build a single export row. When `entry` is null (a month with no data) we
// still emit the row with zero counts and empty metric cells — analysts
// usually want to see "this product/month had no activity" rather than a
// silent gap.
export function buildRow(input: BuildRowInput, locale = "fr-FR"): ExportRow {
  const e = input.entry;
  const month = formatMonthLabel(input.yyyymm, locale);

  if (!e) {
    return {
      Product: input.productName,
      Month: month,
      Currency: input.currency,
      Leads: 0,
      Confirmed: 0,
      Delivered: 0,
      Revenue: 0,
      "Total Spend": 0,
      "Net Profit": 0,
      ROAS: NULL_NUM(),
      "Margin %": NULL_NUM(),
      "Delivery Rate": NULL_NUM(),
      "Profit per delivery": NULL_NUM(),
    };
  }

  const m = computeMetrics({
    ...e,
    initial_stock: null,
    current_stock: null,
    daysElapsed: null,
  });

  const cents = (v: number) => Math.round(v) / 100;
  const pct = (v: number | null) => (v === null ? null : Math.round(v * 10_000) / 100);

  return {
    Product: input.productName,
    Month: month,
    Currency: input.currency,
    Leads: e.leads,
    Confirmed: e.orders,
    Delivered: e.delivered,
    Revenue: cents(e.revenue_cents),
    "Total Spend": m.totalSpend.value === null ? 0 : cents(m.totalSpend.value),
    "Net Profit": m.netProfit.value === null ? 0 : cents(m.netProfit.value),
    ROAS: m.roas.value === null ? null : Math.round(m.roas.value * 100) / 100,
    "Margin %": pct(m.margin.value),
    "Delivery Rate": pct(m.deliveryRate.value),
    "Profit per delivery": m.epo.value === null ? null : cents(m.epo.value),
  };
}

// Serialize rows to CSV. UTF-8 BOM is prepended so Excel detects the
// encoding without a "Get Data" dance.
export function toCsv(
  rows: ExportRow[],
  include: ExportInclude = "full",
): string {
  const columns = include === "kpis" ? [...KPI_COLUMNS] : [...FULL_COLUMNS];
  const body = Papa.unparse(rows, {
    columns,
    header: true,
    // Null → empty cell, not the literal "null".
    quotes: false,
    skipEmptyLines: false,
  });
  return `﻿${body}`;
}

// "voidcraft-export-2026-06-14.csv". Brand defaults to "voidcraft" until
// profiles get a company_name field.
export function filenameFor(date: Date, brand = "voidcraft"): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${brand}-export-${y}-${m}-${d}.csv`;
}
