import "server-only";

import { monthBounds } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ProductInput } from "@/lib/validators/product";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type MonthRow = Database["public"]["Tables"]["months"]["Row"];
type EntryRow = Database["public"]["Tables"]["entries"]["Row"];

export type ProductStatusFilter = "active" | "archived" | "all";

export type ProductWithMonthSnapshot = ProductRow & {
  month: MonthRow | null;
  entry: EntryRow | null;
};

// All queries below rely on RLS — never pass user_id from callers.

export async function listProducts(): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProduct(id: string): Promise<ProductRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  const supabase = await createClient();
  // user_id is required by the schema but resolved here so action callers
  // don't have to know about it.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      name: input.name,
      country: input.country,
      currency: input.currency,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ProductRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name,
      country: input.country,
      currency: input.currency,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function archiveProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ archived: true })
    .eq("id", id);
  if (error) throw error;
}

export async function unarchiveProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ archived: false })
    .eq("id", id);
  if (error) throw error;
}

// Active products joined with the (optional) month row for the given YYYY-MM
// and that month's entries. Two parallel queries merged in JS — more reliable
// than PostgREST embedded-relation filters across Supabase versions.
export async function listProductsWithMonthSnapshot(
  yyyymm: string,
): Promise<ProductWithMonthSnapshot[]> {
  const bounds = monthBounds(yyyymm);
  if (!bounds) throw new Error("Mois invalide.");

  const supabase = await createClient();

  const [productsRes, monthsRes] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("archived", false)
      .order("name"),
    supabase
      .from("months")
      .select("*, entries(*)")
      .eq("start_date", bounds.start),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (monthsRes.error) throw monthsRes.error;

  const products = productsRes.data ?? [];
  const monthsRaw = (monthsRes.data ?? []) as (MonthRow & {
    entries: EntryRow[] | EntryRow | null;
  })[];

  const byProductId = new Map<string, { month: MonthRow; entry: EntryRow | null }>();
  for (const row of monthsRaw) {
    const { entries, ...month } = row;
    const entry = Array.isArray(entries)
      ? (entries[0] ?? null)
      : (entries ?? null);
    byProductId.set(row.product_id, { month, entry });
  }

  return products.map((p) => {
    const match = byProductId.get(p.id);
    return {
      ...p,
      month: match?.month ?? null,
      entry: match?.entry ?? null,
    };
  });
}
