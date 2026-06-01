import { z } from "zod";

export const createMonthSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "Mois invalide." }),
  label: z
    .string()
    .trim()
    .min(1, { message: "Étiquette requise." })
    .max(40, { message: "40 caractères maximum." }),
  copyFromMonthId: z
    .string()
    .uuid({ message: "Identifiant invalide." })
    .nullable()
    .optional(),
});

export const monthIdSchema = z
  .string()
  .uuid({ message: "Identifiant invalide." });

export type CreateMonthInput = z.infer<typeof createMonthSchema>;
