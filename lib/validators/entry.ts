import { z } from "zod";

import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const nonNegInt = z
  .number()
  .int({ message: "Doit être un entier." })
  .nonnegative({ message: "Doit être positif ou zéro." });

const currency = z.enum(SUPPORTED_CURRENCIES, {
  message: "Devise non supportée.",
});

export const entrySchema = z.object({
  leads: nonNegInt,
  orders: nonNegInt,
  delivered: nonNegInt,
  revenue_cents: nonNegInt,

  ads_spend_cents: nonNegInt,
  test_spend_cents: nonNegInt,
  ad_account_cents: nonNegInt,
  product_cost_cents: nonNegInt,
  service_cost_cents: nonNegInt,
  bonus_cents: nonNegInt,

  initial_stock: nonNegInt.nullable(),
  current_stock: nonNegInt.nullable(),

  // Per-entry currencies (see migration 0008). Sales and costs are denominated
  // in their own currency; downstream conversions take them to the product's
  // base currency before computing metrics.
  sales_currency: currency,
  costs_currency: currency,
});

export const entryPatchSchema = entrySchema.partial();

export type EntryValues = z.infer<typeof entrySchema>;
export type EntryPatch = z.infer<typeof entryPatchSchema>;
export type EntryField = keyof EntryValues;
