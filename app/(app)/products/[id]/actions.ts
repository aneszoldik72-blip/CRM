"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/app/(auth)/actions";
import { productIdSchema } from "@/lib/validators/product";
import { createMonthSchema } from "@/lib/validators/month";
import { createMonth, type MonthRow } from "@/lib/db/months";

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

export type CreateMonthResult = ActionResult & { month?: MonthRow };

export async function createMonthAction(
  productId: unknown,
  input: unknown,
): Promise<CreateMonthResult> {
  const parsedId = productIdSchema.safeParse(productId);
  if (!parsedId.success) {
    return { ok: false, serverError: "Identifiant produit invalide." };
  }
  const parsed = createMonthSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  try {
    const month = await createMonth(parsedId.data, parsed.data);
    revalidatePath(`/products/${parsedId.data}`);
    return { ok: true, month };
  } catch (err) {
    return {
      ok: false,
      serverError: err instanceof Error ? err.message : "Erreur inconnue.",
    };
  }
}
