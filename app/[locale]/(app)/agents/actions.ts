"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import type { ActionResult } from "@/app/[locale]/(auth)/actions";
import {
  createAgent,
  setAgentActive,
  updateAgent,
  type AgentRow,
} from "@/lib/db/agents";
import {
  upsertConfirmation,
  type ConfirmationRow,
} from "@/lib/db/confirmations";
import { agentIdSchema, agentInputSchema } from "@/lib/validators/agent";
import {
  confirmationKeySchema,
  confirmationPatchSchema,
} from "@/lib/validators/confirmation";

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

export type CreateAgentResult = ActionResult & { agent?: AgentRow };

export async function createAgentAction(
  input: unknown,
): Promise<CreateAgentResult> {
  const t = await getTranslations("errors");
  const parsed = agentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  try {
    const agent = await createAgent(parsed.data);
    revalidatePath("/agents");
    return { ok: true, agent };
  } catch (err) {
    return {
      ok: false,
      serverError: err instanceof Error ? err.message : t("unknown"),
    };
  }
}

export type UpdateAgentResult = ActionResult & { agent?: AgentRow };

export async function updateAgentAction(
  id: unknown,
  input: unknown,
): Promise<UpdateAgentResult> {
  const t = await getTranslations("errors");
  const parsedId = agentIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, serverError: t("invalidId") };
  }
  const parsed = agentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsed.error) };
  }

  try {
    const agent = await updateAgent(parsedId.data, parsed.data);
    revalidatePath("/agents");
    revalidatePath(`/agents/${parsedId.data}`);
    return { ok: true, agent };
  } catch (err) {
    return {
      ok: false,
      serverError: err instanceof Error ? err.message : t("unknown"),
    };
  }
}

export async function setAgentActiveAction(
  id: unknown,
  active: unknown,
): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const parsedId = agentIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, serverError: t("invalidId") };
  }
  if (typeof active !== "boolean") {
    return { ok: false, serverError: t("invalidId") };
  }

  try {
    await setAgentActive(parsedId.data, active);
    revalidatePath("/agents");
    revalidatePath(`/agents/${parsedId.data}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      serverError: err instanceof Error ? err.message : t("unknown"),
    };
  }
}

export type UpsertConfirmationResult = ActionResult & {
  confirmation?: ConfirmationRow;
};

// No revalidatePath here — the form is auto-saving while the user types and
// a revalidation would refetch over in-flight values. Same pattern as
// updateEntryAction. List/widget data refreshes naturally on navigation.
export async function upsertConfirmationAction(
  key: unknown,
  patch: unknown,
): Promise<UpsertConfirmationResult> {
  const t = await getTranslations("errors");
  const parsedKey = confirmationKeySchema.safeParse(key);
  if (!parsedKey.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsedKey.error) };
  }
  const parsedPatch = confirmationPatchSchema.safeParse(patch);
  if (!parsedPatch.success) {
    return { ok: false, fieldErrors: zodErrorsToMap(parsedPatch.error) };
  }

  try {
    const confirmation = await upsertConfirmation(
      parsedKey.data,
      parsedPatch.data,
    );
    return { ok: true, confirmation };
  } catch (err) {
    return {
      ok: false,
      serverError: err instanceof Error ? err.message : t("unknown"),
    };
  }
}
