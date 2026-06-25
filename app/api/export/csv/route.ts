import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { bcp47, type AppLocale } from "@/i18n/routing";
import { convertCents, getRates, type Rates } from "@/lib/currency";
import { currentYyyymm, nextYyyymm, prevYyyymm } from "@/lib/date";
import { getProfile } from "@/lib/db/profile";
import { listExportRows } from "@/lib/db/exports";
import { buildRow, filenameFor, toCsv } from "@/lib/export/csv";
import { createClient } from "@/lib/supabase/server";
import {
  BASE_CURRENCIES,
  isBaseCurrency,
  type BaseCurrency,
} from "@/lib/validators/profile";

const RANGES = ["month", "lastMonth", "last3", "all", "custom"] as const;
const INCLUDES = ["kpis", "full"] as const;

const querySchema = z.object({
  range: z.enum(RANGES),
  from: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  products: z.string().optional(), // "all" or csv of UUIDs
  include: z.enum(INCLUDES).default("full"),
  currency: z.enum(BASE_CURRENCIES).optional(),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseProducts(raw: string | undefined): "all" | string[] {
  if (!raw || raw === "all") return "all";
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const valid = ids.filter((id) => UUID_RE.test(id));
  if (valid.length === 0) return "all";
  return valid;
}

function resolveRange(
  range: (typeof RANGES)[number],
  from: string | undefined,
  to: string | undefined,
): { yyyymmFrom: string; yyyymmTo: string } | null {
  const now = currentYyyymm();
  switch (range) {
    case "month":
      return { yyyymmFrom: now, yyyymmTo: now };
    case "lastMonth": {
      const last = prevYyyymm(now);
      return { yyyymmFrom: last, yyyymmTo: last };
    }
    case "last3": {
      const m2 = prevYyyymm(prevYyyymm(now));
      return { yyyymmFrom: m2, yyyymmTo: now };
    }
    case "all":
      // 10 years back to 12 months ahead is "all" for any realistic dataset.
      return { yyyymmFrom: tenYearsAgo(now), yyyymmTo: oneYearAhead(now) };
    case "custom":
      if (!from || !to) return null;
      // Normalize swapped order so the API is forgiving.
      return from <= to
        ? { yyyymmFrom: from, yyyymmTo: to }
        : { yyyymmFrom: to, yyyymmTo: from };
  }
}

function tenYearsAgo(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return `${(y as number) - 10}-${String(m).padStart(2, "0")}`;
}

function oneYearAhead(yyyymm: string): string {
  let cursor = yyyymm;
  for (let i = 0; i < 12; i++) cursor = nextYyyymm(cursor);
  return cursor;
}

// Convert every cents-valued field of the entry to `to`. Revenue is
// converted from the entry's sales_currency; all cost fields are converted
// from costs_currency.
function convertEntry<E extends Record<string, number>>(
  entry: E,
  salesCurrency: string,
  costsCurrency: string,
  to: string,
  rates: Rates,
): E {
  const out: Record<string, number> = { ...entry };
  if (typeof out.revenue_cents === "number") {
    out.revenue_cents = convertCents(
      out.revenue_cents,
      salesCurrency,
      to,
      rates,
    );
  }
  for (const key of [
    "ads_spend_cents",
    "test_spend_cents",
    "ad_account_cents",
    "product_cost_cents",
    "service_cost_cents",
    "bonus_cents",
  ]) {
    if (typeof out[key] === "number") {
      out[key] = convertCents(out[key]!, costsCurrency, to, rates);
    }
  }
  return out as E;
}

export async function GET(request: NextRequest) {
  // Auth check — RLS handles row isolation, but a 401 is cheaper than letting
  // the query return an empty CSV for an unauthenticated request.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new NextResponse("Invalid query parameters", { status: 400 });
  }
  const { range, from, to, products, include, currency } = parsed.data;

  const bounds = resolveRange(range, from, to);
  if (!bounds) {
    return new NextResponse("Custom range requires from and to", {
      status: 400,
    });
  }

  // Resolve base currency: URL → profile → USD.
  const profile = await getProfile();
  const baseCurrency: BaseCurrency = isBaseCurrency(currency)
    ? currency
    : isBaseCurrency(profile?.default_currency)
      ? profile.default_currency
      : "USD";

  // Locale for the Month column. Profile.locale uses our app locale codes
  // ("fr" | "en" | "ar"); map to BCP-47 for Intl.
  const profileLocale = (profile?.locale ?? "fr") as AppLocale;
  const csvLocale = bcp47(profileLocale);

  const [triples, rates] = await Promise.all([
    listExportRows({
      productIds: parseProducts(products),
      yyyymmFrom: bounds.yyyymmFrom,
      yyyymmTo: bounds.yyyymmTo,
    }),
    getRates(),
  ]);

  const rows = triples.map(({ product, month, entry }) => {
    const yyyymm = month.start_date.slice(0, 7);
    if (!entry) {
      return buildRow(
        {
          productName: product.name,
          yyyymm,
          currency: baseCurrency,
          entry: null,
        },
        csvLocale,
      );
    }
    const converted = convertEntry(
      {
        leads: entry.leads,
        orders: entry.orders,
        delivered: entry.delivered,
        revenue_cents: entry.revenue_cents,
        ads_spend_cents: entry.ads_spend_cents,
        test_spend_cents: entry.test_spend_cents,
        ad_account_cents: entry.ad_account_cents,
        product_cost_cents: entry.product_cost_cents,
        service_cost_cents: entry.service_cost_cents,
        bonus_cents: entry.bonus_cents,
      },
      entry.sales_currency,
      entry.costs_currency,
      baseCurrency,
      rates,
    );
    return buildRow(
      {
        productName: product.name,
        yyyymm,
        currency: baseCurrency,
        entry: converted,
      },
      csvLocale,
    );
  });

  const csv = toCsv(rows, include);
  const filename = filenameFor(new Date());

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

