import { z } from "zod";

const nonNegInt = z
  .number()
  .int({ message: "Doit être un entier." })
  .nonnegative({ message: "Doit être positif ou zéro." });

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
});

export const entryPatchSchema = entrySchema.partial();

export type EntryValues = z.infer<typeof entrySchema>;
export type EntryPatch = z.infer<typeof entryPatchSchema>;
export type EntryField = keyof EntryValues;
