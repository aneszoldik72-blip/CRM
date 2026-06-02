import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EntryPatch } from "@/lib/validators/entry";
import type { Database } from "@/types/database";

export type EntryRow = Database["public"]["Tables"]["entries"]["Row"];

export async function getEntry(monthId: string): Promise<EntryRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("month_id", monthId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Upsert keyed by month_id (UNIQUE constraint on entries.month_id enforces 1:1
// with months). Only fields present in `patch` are touched on conflict.
export async function updateEntry(
  monthId: string,
  patch: EntryPatch,
): Promise<EntryRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .upsert(
      { month_id: monthId, ...patch },
      { onConflict: "month_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
