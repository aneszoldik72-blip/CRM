import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProfileUpdateInput } from "@/lib/validators/profile";
import type { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateDefaultCurrency(currency: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { error } = await supabase
    .from("profiles")
    .update({ default_currency: currency })
    .eq("id", user.id);
  if (error) throw error;
}

// Partial-update helper used by every auto-save field on the settings page.
// Only keys present in `patch` are written.
export async function updateProfile(
  patch: ProfileUpdateInput,
): Promise<ProfileRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) {
    // Log the raw PostgREST error so we can see code/details/hint even
    // when the caller turns it into a string for the toast.
    console.error("SAVE PROFILE ERROR:", {
      patch,
      user_id: user.id,
      error,
    });
    // Wrap into a real Error so `instanceof Error` checks upstream still
    // work, while preserving the full Postgres detail in the message.
    const parts = [error.message, error.details, error.hint]
      .filter((s): s is string => typeof s === "string" && s.length > 0);
    const summary = parts.length > 0
      ? parts.join(" — ")
      : "Unknown DB error";
    const wrapped = new Error(
      error.code ? `${summary} [${error.code}]` : summary,
    );
    (wrapped as Error & { cause?: unknown }).cause = error;
    throw wrapped;
  }
  return data;
}
