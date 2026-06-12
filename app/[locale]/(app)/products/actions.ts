"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import type { ActionResult } from "@/app/[locale]/(auth)/actions";
import {
  archiveProduct,
  createProduct,
  unarchiveProduct,
  updateProduct,
  type ProductRow,
} from "@/lib/db/products";
import {
  productIdSchema,
  productInputSchema,
} from "@/lib/validators/product";

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

async function unknownErrorMessage(): Promise<string> {
  const t = await getTranslations("errors");
  return t("unknown");
}

async function invalidIdMessage(): Promise<string> {
  const t = await getTranslations("errors");
  return t("invalidId");
}

export type CreateProductResult = ActionResult & { product?: ProductRow };

export async function createProductAction(
  input: unknown,
): Promise<CreateProductResult> {
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  try {
    const product = await createProduct(parsed.data);
    revalidatePath("/products");
    return { ok: true, product };
  } catch (err) {
    return {
      ok: false,
      serverError:
        err instanceof Error ? err.message : await unknownErrorMessage(),
    };
  }
}

export type UpdateProductResult = ActionResult & { product?: ProductRow };

export async function updateProductAction(
  id: unknown,
  input: unknown,
): Promise<UpdateProductResult> {
  const parsedId = productIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, serverError: await invalidIdMessage() };
  }
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  try {
    const product = await updateProduct(parsedId.data, parsed.data);
    revalidatePath("/products");
    revalidatePath(`/products/${parsedId.data}`);
    return { ok: true, product };
  } catch (err) {
    return {
      ok: false,
      serverError:
        err instanceof Error ? err.message : await unknownErrorMessage(),
    };
  }
}

export async function archiveProductAction(id: unknown): Promise<ActionResult> {
  const parsed = productIdSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, serverError: await invalidIdMessage() };
  }
  try {
    await archiveProduct(parsed.data);
    revalidatePath("/products");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      serverError:
        err instanceof Error ? err.message : await unknownErrorMessage(),
    };
  }
}

export async function unarchiveProductAction(
  id: unknown,
): Promise<ActionResult> {
  const parsed = productIdSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, serverError: await invalidIdMessage() };
  }
  try {
    await unarchiveProduct(parsed.data);
    revalidatePath("/products");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      serverError:
        err instanceof Error ? err.message : await unknownErrorMessage(),
    };
  }
}
