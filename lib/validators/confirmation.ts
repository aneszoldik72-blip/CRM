import { z } from "zod";

const nonNegInt = z
  .number()
  .int({ message: "confirmation.field.integer" })
  .min(0, { message: "confirmation.field.nonNeg" })
  .max(10_000, { message: "confirmation.field.tooLarge" });

// The triple (agent_id, product_id, date) identifies a row. Date is the
// YYYY-MM-DD string Postgres accepts directly.
export const confirmationKeySchema = z.object({
  agent_id: z.string().uuid({ message: "confirmation.agentId.invalid" }),
  product_id: z.string().uuid({ message: "confirmation.productId.invalid" }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "confirmation.date.invalid" }),
});

export const confirmationPatchSchema = z
  .object({
    called: nonNegInt.optional(),
    confirmed: nonNegInt.optional(),
    rejected: nonNegInt.optional(),
  })
  .refine(
    (v) => Object.keys(v).length > 0,
    { message: "confirmation.patch.empty" },
  );

export type ConfirmationKey = z.infer<typeof confirmationKeySchema>;
export type ConfirmationPatch = z.infer<typeof confirmationPatchSchema>;
export type ConfirmationField = "called" | "confirmed" | "rejected";
