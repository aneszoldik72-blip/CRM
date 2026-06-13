import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ConfirmationKey,
  ConfirmationPatch,
} from "@/lib/validators/confirmation";
import type { Database } from "@/types/database";

export type ConfirmationRow =
  Database["public"]["Tables"]["confirmations"]["Row"];

// All confirmations belong to one product on one day for one agent. The
// (agent_id, product_id, date) tuple is unique; upserts hit that key.

// One day, one product — used by the daily entry form on the product page.
export async function listConfirmationsForProductOnDate(
  productId: string,
  date: string,
): Promise<ConfirmationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("confirmations")
    .select("*")
    .eq("product_id", productId)
    .eq("date", date);
  if (error) throw error;
  return data ?? [];
}

// All confirmations for a product across a date range — used for the
// "top performers" widget and per-product agent metrics.
export async function listConfirmationsForProductRange(
  productId: string,
  range: { from: string; to: string },
): Promise<ConfirmationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("confirmations")
    .select("*")
    .eq("product_id", productId)
    .gte("date", range.from)
    .lte("date", range.to)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Agent-scoped feed across products — agent detail page.
export async function listConfirmationsForAgent(
  agentId: string,
  range: { from: string; to: string },
): Promise<ConfirmationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("confirmations")
    .select("*")
    .eq("agent_id", agentId)
    .gte("date", range.from)
    .lte("date", range.to)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// All confirmations for a date range — used by the agents list to compute
// leaderboard + per-agent KPIs. RLS keeps it scoped to the current user.
export async function listConfirmationsRange(range: {
  from: string;
  to: string;
}): Promise<ConfirmationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("confirmations")
    .select("*")
    .gte("date", range.from)
    .lte("date", range.to);
  if (error) throw error;
  return data ?? [];
}

// Upsert keyed by the (agent_id, product_id, date) unique constraint. Only
// fields present in `patch` are updated on conflict — matches the entries
// auto-save pattern.
export async function upsertConfirmation(
  key: ConfirmationKey,
  patch: ConfirmationPatch,
): Promise<ConfirmationRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("confirmations")
    .upsert(
      { ...key, ...patch },
      { onConflict: "agent_id,product_id,date" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
