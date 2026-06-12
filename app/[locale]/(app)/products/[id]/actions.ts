"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import type { ActionResult } from "@/app/[locale]/(auth)/actions";
import { productIdSchema } from "@/lib/validators/product";
import { createMonthSchema, monthIdSchema } from "@/lib/validators/month";
import { createMonth, type MonthRow } from "@/lib/db/months";
import { updateEntry, type EntryRow } from "@/lib/db/entries";
import { entryPatchSchema } from "@/lib/validators/entry";

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
  const t = await getTranslations("errors");
  const parsedId = productIdSchema.safeParse(productId);
  if (!parsedId.success) {
    return { ok: false, serverError: t("invalidProductId") };
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
      serverError: err instanceof Error ? err.message : t("unknown"),
    };
  }
}

export type UpdateEntryResult = ActionResult & { entry?: EntryRow };

// No revalidatePath here on purpose: the user is mid-typing and a revalidation
// would refetch and overwrite their in-flight values. The auto-save itself is
// the source of truth; revalidation happens naturally on month switch or list
// visits.
export async function updateEntryAction(
  monthId: unknown,
  patch: unknown,
): Promise<UpdateEntryResult> {
  const t = await getTranslations("errors");
  const parsedId = monthIdSchema.safeParse(monthId);
  if (!parsedId.success) {
    return { ok: false, serverError: t("invalidMonthId") };
  }
  const parsed = entryPatchSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  try {
    const entry = await updateEntry(parsedId.data, parsed.data);
    return { ok: true, entry };
  } catch (err) {
    return {
      ok: false,
      serverError: err instanceof Error ? err.message : t("unknown"),
    };
  }
}
