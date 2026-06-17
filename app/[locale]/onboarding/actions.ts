"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";

import type { ActionResult } from "@/app/[locale]/(auth)/actions";
import { createProduct } from "@/lib/db/products";
import { getOrCreateCurrentMonth } from "@/lib/db/months";
import { updateEntry } from "@/lib/db/entries";
import { updateProfile } from "@/lib/db/profile";
import { entrySchema } from "@/lib/validators/entry";
import { productInputSchema } from "@/lib/validators/product";
import {
  BASE_CURRENCIES,
  isBaseCurrency,
} from "@/lib/validators/profile";

const profileBundleSchema = z.object({
  full_name: z.string().trim().max(120),
  country: z
    .string()
    .trim()
    .length(2, { message: "settings.country.invalid" }),
  default_currency: z.enum(BASE_CURRENCIES),
});

const completeOnboardingSchema = z.object({
  profile: profileBundleSchema,
  product: productInputSchema,
  entry: entrySchema,
});

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

// Final submit. Runs profile → product → month → entry → flip the
// onboarding_complete flag. The pieces aren't transactional because Supabase
// can't do that from the client, so a partial failure leaves the user with
// whatever stuck and they re-submit. The upserts handle re-runs cleanly.
export async function completeOnboardingAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = completeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    console.error("[completeOnboardingAction] validation failed", {
      issues: parsed.error.issues,
    });
    return {
      ok: false,
      serverError: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }
  const { profile, product, entry } = parsed.data;

  try {
    await updateProfile({
      full_name: profile.full_name,
      country: profile.country,
      default_currency: profile.default_currency,
    });

    const productRow = await createProduct({
      name: product.name,
      country: product.country,
      currency: product.currency,
    });

    const month = await getOrCreateCurrentMonth(productRow.id);
    await updateEntry(month.id, entry);

    // Last — flip the gate. Done via a dedicated helper that bypasses the
    // profileUpdateSchema's "patch.empty" refine (we touch a single boolean
    // column the schema doesn't enumerate).
    await markOnboardingComplete();

    return { ok: true };
  } catch (err) {
    console.error("[completeOnboardingAction] write failed", err);
    return { ok: false, serverError: describeServerError(err) };
  }
}

export async function skipOnboardingAction(): Promise<ActionResult> {
  try {
    await markOnboardingComplete();
    return { ok: true };
  } catch (err) {
    console.error("[skipOnboardingAction] failed", err);
    const t = await getTranslations("errors");
    return {
      ok: false,
      serverError: describeServerError(err) || t("unknown"),
    };
  }
}

// Helper that bypasses the profileUpdateSchema's "patch must be non-empty"
// refinement — we want to flip just one column.
async function markOnboardingComplete(): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);
  if (error) {
    const parts = [error.message, error.details, error.hint]
      .filter((s): s is string => typeof s === "string" && s.length > 0);
    const summary = parts.length > 0 ? parts.join(" — ") : "DB error";
    throw new Error(error.code ? `${summary} [${error.code}]` : summary);
  }
}

// Re-export for callers that want to assert the BaseCurrency shape themselves.
export { isBaseCurrency };
