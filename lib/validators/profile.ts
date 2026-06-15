import { z } from "zod";

import { COUNTRY_BY_CODE } from "@/lib/data/countries";
import { routing } from "@/i18n/routing";

// The 6 currencies the dashboard switcher offers as a base view. NGN stays
// available as a product currency (and is converted into whichever of these
// the user picks) but isn't a selectable base.
export const BASE_CURRENCIES = [
  "USD",
  "MAD",
  "XOF",
  "EUR",
  "DZD",
  "TND",
] as const;

export type BaseCurrency = (typeof BASE_CURRENCIES)[number];

export const baseCurrencySchema = z.enum(BASE_CURRENCIES, {
  message: "Devise invalide.",
});

export function isBaseCurrency(value: unknown): value is BaseCurrency {
  return (
    typeof value === "string" &&
    (BASE_CURRENCIES as readonly string[]).includes(value)
  );
}

// Partial profile patch — every settings field is optional and saves
// independently via the inline-edit pattern. Empty strings normalize to
// null where the column is nullable.
export const profileUpdateSchema = z
  .object({
    full_name: z
      .string()
      .max(120, { message: "settings.fullName.tooLong" })
      .optional(),
    country: z
      .string()
      .toUpperCase()
      .refine((c) => COUNTRY_BY_CODE.has(c), {
        message: "settings.country.invalid",
      })
      .optional(),
    default_currency: baseCurrencySchema.optional(),
    locale: z.enum(routing.locales).optional(),
    image_url: z.string().url().max(2048).nullable().optional(),
    notification_payment_failed: z.boolean().optional(),
    notification_trial_ending: z.boolean().optional(),
    notification_weekly_summary: z.boolean().optional(),
  })
  .refine(
    (v) => Object.keys(v).length > 0,
    { message: "settings.patch.empty" },
  );

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Email change schema — Supabase sends the verification mail; we only
// validate format here.
export const emailChangeSchema = z.object({
  email: z
    .string()
    .min(1, { message: "settings.email.required" })
    .email({ message: "settings.email.invalid" }),
});
export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

// Password change — current + new + confirm. Server re-auths with current
// before calling updateUser.
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "settings.password.currentRequired" }),
    newPassword: z
      .string()
      .min(8, { message: "settings.password.tooShort" }),
    confirmPassword: z
      .string()
      .min(1, { message: "settings.password.confirmRequired" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "settings.password.mismatch",
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// Account deletion — typed phrase must match exactly. Kept English in all
// locales because the server does string equality; translating it would
// break the equality check.
export const DELETE_CONFIRMATION_PHRASE = "DELETE my account";

export const deleteAccountSchema = z.object({
  confirmation: z.literal(DELETE_CONFIRMATION_PHRASE, {
    message: "settings.delete.confirmationMismatch",
  }),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
