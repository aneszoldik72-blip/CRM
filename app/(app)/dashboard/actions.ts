"use server";

import type { ActionResult } from "@/app/(auth)/actions";
import { updateDefaultCurrency } from "@/lib/db/profile";
import { baseCurrencySchema } from "@/lib/validators/profile";

export async function updateDefaultCurrencyAction(
  currency: unknown,
): Promise<ActionResult> {
  const parsed = baseCurrencySchema.safeParse(currency);
  if (!parsed.success) {
    return { ok: false, serverError: "Devise invalide." };
  }

  try {
    await updateDefaultCurrency(parsed.data);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      serverError: err instanceof Error ? err.message : "Erreur inconnue.",
    };
  }
}
