import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ProductInput } from "@/lib/validators/product";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductStatusFilter = "active" | "archived" | "all";

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
