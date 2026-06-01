import "server-only";

import {
  currentYyyymm,
  formatMonthLabel,
  monthBounds,
  yyyymmFromDate,
} from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { CreateMonthInput } from "@/lib/validators/month";
import type { Database } from "@/types/database";

export type MonthRow = Database["public"]["Tables"]["months"]["Row"];
type EntriesRow = Database["public"]["Tables"]["entries"]["Row"];
type EntriesInsert = Database["public"]["Tables"]["entries"]["Insert"];

export async function listMonths(productId: string): Promise<MonthRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .eq("product_id", productId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMonth(monthId: string): Promise<MonthRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .eq("id", monthId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMonth(
  productId: string,
  input: CreateMonthInput,
): Promise<MonthRow> {
  const supabase = await createClient();
  const bounds = monthBounds(input.month);
  if (!bounds) throw new Error("Mois invalide.");

  // Optionally pull the source entries so we can carry cost values over.
  let source: EntriesRow | null = null;
  if (input.copyFromMonthId) {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("month_id", input.copyFromMonthId)
      .maybeSingle();
    if (error) throw error;
    source = data;
  }

  const { data: monthRow, error: monthErr } = await supabase
    .from("months")
    .insert({
      product_id: productId,
      label: input.label,
      start_date: bounds.start,
      end_date: bounds.end,
    })
    .select("*")
    .single();
  if (monthErr) throw monthErr;

  const entriesPayload: EntriesInsert = source
    ? {
        month_id: monthRow.id,
        // Costs are carried over.
        ads_spend_cents: source.ads_spend_cents,
        test_spend_cents: source.test_spend_cents,
        ad_account_cents: source.ad_account_cents,
        product_cost_cents: source.product_cost_cents,
        service_cost_cents: source.service_cost_cents,
        bonus_cents: source.bonus_cents,
        // Sales reset to zero (column defaults would also work, but be explicit).
        leads: 0,
        orders: 0,
        delivered: 0,
        revenue_cents: 0,
        // Stock left null — chaining initial_stock from previous current_stock
        // is a separate feature.
        initial_stock: null,
        current_stock: null,
      }
    : { month_id: monthRow.id };

  const { error: entriesErr } = await supabase
    .from("entries")
    .insert(entriesPayload);
  if (entriesErr) throw entriesErr;

  return monthRow;
}

// Returns the newest month for the product, creating one for the current
// calendar month if none exist. Idempotent enough for safe use during page
// render: a parallel race could create two rows with the same start_date —
// rare, and tolerable until a unique constraint is added.
export async function getOrCreateCurrentMonth(
  productId: string,
): Promise<MonthRow> {
  const existing = await listMonths(productId);
  if (existing.length > 0) return existing[0]!;

  const month = currentYyyymm();
  return createMonth(productId, {
    month,
    label: formatMonthLabel(month),
  });
}

export function getMonthYyyymm(row: MonthRow): string {
  return yyyymmFromDate(row.start_date);
}
