"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, type LimitedRoute } from "@/lib/ratelimit";
import {
  requestResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validators/auth";

export type ActionResult = {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  serverError?: string;
  // Present only when serverError === "auth.rateLimit". Lets the form show
  // "Réessaie dans N min." instead of a static message.
  retryAfterSeconds?: number;
};

// Wraps a server action with a per-IP rate limit. Returns the limit hit
// response (ActionResult) or null to continue.
async function rateLimited(route: LimitedRoute): Promise<ActionResult | null> {
  const ip = await getClientIp();
  const { success, reset } = await checkRateLimit(route, ip);
  if (success) return null;
  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return {
    ok: false,
    serverError: "auth.rateLimit",
    retryAfterSeconds,
  };
}

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function zodErrorsToMap(err: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const limited = await rateLimited("signup");
  if (limited) return limited;

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: (formData.get("fullName") as string | null) ?? "",
    locale: (formData.get("locale") as string | null) ?? "fr",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.fullName ? parsed.data.fullName : null,
        locale: parsed.data.locale,
      },
    },
  });

  if (error) return { ok: false, serverError: error.message };

  const locale = await getLocale();
  redirect({
    href: `/verify-email?email=${encodeURIComponent(parsed.data.email)}`,
    locale,
  });
  // redirect() throws, but TS's narrowing through the destructured `never`
  // signature is unreliable. Returning here is unreachable but satisfies
  // the type checker.
  return { ok: true };
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const limited = await rateLimited("login");
  if (limited) return limited;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Generic message on purpose: don't reveal whether the email exists.
    return { ok: false, serverError: "auth.signin.invalidCredentials" };
  }

  const locale = await getLocale();
  redirect({ href: "/dashboard", locale });
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/login", locale });
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<ActionResult> {
  const limited = await rateLimited("forgot");
  if (limited) return limited;

  const parsed = requestResetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Always report success — UI shows "we sent to {email}" either way.
  return { ok: true };
}

export async function updatePassword(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { ok: false, serverError: error.message };

  const locale = await getLocale();
  redirect({ href: "/login?reset=success", locale });
  return { ok: true };
}
