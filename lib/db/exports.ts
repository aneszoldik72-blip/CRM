import "server-only";

import { monthBounds } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type MonthRow = Database["public"]["Tables"]["months"]["Row"];
type EntryRow = Database["public"]["Tables"]["entries"]["Row"];

export type ExportTriple = {
  product: ProductRow;
  month: MonthRow;
  entry: EntryRow | null;
};

// Returns one row per (product, month) within the inclusive YYYY-MM range,
// joining the optional entries row. RLS keeps results scoped to the user.
// `productIds === "all"` skips the product filter (still bound by RLS).
export async function listExportRows(opts: {
  productIds: "all" | string[];
  yyyymmFrom: string;
  yyyymmTo: string;
}): Promise<ExportTriple[]> {
  const fromBounds = monthBounds(opts.yyyymmFrom);
  const toBounds = monthBounds(opts.yyyymmTo);
  if (!fromBounds || !toBounds) return [];

  const supabase = await createClient();

  // Pull products and the month/entry rows in parallel. PostgREST embedded
  // selects don't filter the outer rows on inner predicates, so two queries
  // + a JS join is the most predictable shape.
  let productsQuery = supabase.from("products").select("*").order("name");
  if (opts.productIds !== "all" && opts.productIds.length > 0) {
    productsQuery = productsQuery.in("id", opts.productIds);
  }

  let monthsQuery = supabase
    .from("months")
    .select("*, entries(*)")
    .gte("start_date", fromBounds.start)
    .lte("start_date", toBounds.start)
    .order("start_date", { ascending: true });
  if (opts.productIds !== "all" && opts.productIds.length > 0) {
    monthsQuery = monthsQuery.in("product_id", opts.productIds);
  }

  const [productsRes, monthsRes] = await Promise.all([
    productsQuery,
    monthsQuery,
  ]);
  if (productsRes.error) throw productsRes.error;
  if (monthsRes.error) throw monthsRes.error;

  const products = productsRes.data ?? [];
  const productById = new Map(products.map((p) => [p.id, p]));

  const monthsRaw = (monthsRes.data ?? []) as (MonthRow & {
    entries: EntryRow[] | EntryRow | null;
  })[];

  const out: ExportTriple[] = [];
  for (const row of monthsRaw) {
    const product = productById.get(row.product_id);
    if (!product) continue; // product filtered out, skip orphan month
    const { entries, ...month } = row;
    const entry = Array.isArray(entries)
      ? (entries[0] ?? null)
      : (entries ?? null);
    out.push({ product, month, entry });
  }

  // Sort by product name, then chronologically — matches the column order
  // in the CSV (Product, Month, …) so the file reads top-to-bottom naturally.
  out.sort((a, b) => {
    const byName = a.product.name.localeCompare(b.product.name);
    if (byName !== 0) return byName;
    return a.month.start_date.localeCompare(b.month.start_date);
  });

  return out;
}
