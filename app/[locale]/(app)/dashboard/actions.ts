"use server";

import { getTranslations } from "next-intl/server";

import type { ActionResult } from "@/app/[locale]/(auth)/actions";
import { updateDefaultCurrency } from "@/lib/db/profile";
import { baseCurrencySchema } from "@/lib/validators/profile";

export async function updateDefaultCurrencyAction(
  currency: unknown,
): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const parsed = baseCurrencySchema.safeParse(currency);
  if (!parsed.success) {
    return { ok: false, serverError: t("invalidCurrency") };
  }

  try {
    await updateDefaultCurrency(parsed.data);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      serverError: err instanceof Error ? err.message : t("unknown"),
    };
  }
}
