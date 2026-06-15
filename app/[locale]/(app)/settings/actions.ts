"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import type { ActionResult } from "@/app/[locale]/(auth)/actions";
import { updateProfile, type ProfileRow } from "@/lib/db/profile";
import { createClient } from "@/lib/supabase/server";
import {
  emailChangeSchema,
  passwordChangeSchema,
  profileUpdateSchema,
} from "@/lib/validators/profile";

function zodErrorsToMap(
  err: import("zod").ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// PostgREST errors come back as plain objects with `message`, `code`,
// `details`, `hint` — they are NOT Error instances, so the old
// `err instanceof Error ? err.message : t("unknown")` was collapsing every
// DB error into the generic "Unknown error" toast.
function describeServerError(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.name || "Error with no message";
  }
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof obj.message === "string" && obj.message) parts.push(obj.message);
    if (typeof obj.details === "string" && obj.details) parts.push(obj.details);
    if (typeof obj.hint === "string" && obj.hint) parts.push(`hint: ${obj.hint}`);
    if (typeof obj.code === "string" && obj.code) parts.push(`[${obj.code}]`);
    if (parts.length > 0) return parts.join(" — ");
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export type UpdateProfileResult = ActionResult & { profile?: ProfileRow };

// Partial profile patch. The settings forms auto-save per field; this action
// accepts any subset of the schema.
export async function updateProfileAction(
  patch: unknown,
): Promise<UpdateProfileResult> {
  const parsed = profileUpdateSchema.safeParse(patch);
  if (!parsed.success) {
    console.error("[updateProfileAction] zod validation failed", {
      issues: parsed.error.issues,
      patch,
    });
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  try {
    const profile = await updateProfile(parsed.data);
    // No revalidatePath — auto-save fires while the user is typing.
    return { ok: true, profile };
  } catch (err) {
    // Log the raw object so we see code/details/hint, then surface a
    // human-readable string to the client.
    console.error("[updateProfileAction] DB update failed", {
      patch: parsed.data,
      err,
    });
    return { ok: false, serverError: describeServerError(err) };
  }
}

// Email change. Supabase emails a verification link to the new address;
// until clicked, the user keeps signing in with the old one. The pending
// state lives on `auth.users.new_email` and is read by the settings page.
export async function changeEmailAction(input: unknown): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const parsed = emailChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, serverError: t("unknown") };
  }
  if (parsed.data.email === user.email) {
    return { ok: false, fieldErrors: { email: "settings.email.sameAsCurrent" } };
  }

  const origin = await getOrigin();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${origin}/auth/confirm?next=/settings/security` },
  );
  if (error) return { ok: false, serverError: error.message };

  revalidatePath("/settings/security");
  return { ok: true };
}

// "Cancel pending change" — revert to current email so Supabase clears the
// pending state. The mail token will silently expire.
export async function cancelEmailChangeAction(): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, serverError: t("unknown") };
  }
  const { error } = await supabase.auth.updateUser({ email: user.email });
  if (error) return { ok: false, serverError: error.message };

  revalidatePath("/settings/security");
  return { ok: true };
}

// Re-send the verification mail to the pending new address.
export async function resendEmailChangeAction(): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pending = (user as { new_email?: string | null } | null)?.new_email;
  if (!user || !pending) {
    return { ok: false, serverError: t("unknown") };
  }
  const { error } = await supabase.auth.resend({
    type: "email_change",
    email: pending,
  });
  if (error) return { ok: false, serverError: error.message };
  return { ok: true };
}

// Password change. Re-auths with the current password (via signInWithPassword)
// before calling updateUser. Supabase doesn't enforce re-auth, but treating
// password as a sensitive action is the security-conscious default.
export async function changePasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, serverError: t("unknown") };
  }

  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (reAuthError) {
    return {
      ok: false,
      fieldErrors: { currentPassword: "settings.password.currentWrong" },
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (error) return { ok: false, serverError: error.message };

  return { ok: true };
}

// "Sign out other sessions" — revokes every refresh token except the
// caller's. Used after a successful password change.
export async function signOutOtherSessionsAction(): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    return { ok: false, serverError: error.message || t("unknown") };
  }
  return { ok: true };
}
