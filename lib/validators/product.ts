import { z } from "zod";

import { COUNTRY_BY_CODE } from "@/lib/data/countries";

const CURRENCIES = ["USD", "EUR", "MAD", "DZD", "TND", "XOF", "NGN"] as const;

export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nom requis." })
    .max(80, { message: "80 caractères maximum." }),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((c) => COUNTRY_BY_CODE.has(c), { message: "Pays inconnu." }),
  currency: z.enum(CURRENCIES, { message: "Devise invalide." }),
});

export const updateProductSchema = productInputSchema;

export const productIdSchema = z.string().uuid({ message: "Identifiant invalide." });

export type ProductInput = z.infer<typeof productInputSchema>;
