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
  if (data) return data;

  // Defensive: handle_new_user (migration 0001) should have created a
  // profile row when this user signed up. If it didn't — trigger missing,
  // migration not applied, or it silently failed — create the row now so
  // the rest of the app has something to work with. onboarding_complete
  // defaults to false in the schema, so the layout guard will route the
  // user to /onboarding on their next request.
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? "",
    })
    .select("*")
    .single();
  if (insertError) {
    console.error("[getProfile] lazy-create failed", insertError);
    throw insertError;
  }
  return created;
}

// Atomically claims the welcome-email slot for the current user. Returns
// true exactly once per user — the caller that wins the race. All other
// concurrent callers (prefetch, parallel server renders, retries) get false
// and MUST NOT send.
//
// Atomicity comes from a single conditional UPDATE:
//   UPDATE profiles SET welcome_email_sent_at = now()
//   WHERE id = $1 AND welcome_email_sent_at IS NULL
//   RETURNING id;
//
// Under Postgres READ COMMITTED (the default), the WHERE clause is
// re-evaluated against the latest committed row version when an UPDATE
// blocks on a concurrent write. The second updater therefore sees the
// column is no longer NULL and updates zero rows. RLS additionally scopes
// the update to the calling user.
export async function claimWelcomeEmail(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("profiles")
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("welcome_email_sent_at", null)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
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
