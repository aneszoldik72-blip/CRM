"use client";

import { useTranslations } from "next-intl";

// Stable validator error keys → translation keys under errors.{agent,confirmation}.*
const AGENT_KEY_MAP: Record<string, string> = {
  "agent.name.required": "nameRequired",
  "agent.name.tooLong": "nameTooLong",
  "agent.phone.tooLong": "phoneTooLong",
  "agent.photoUrl.invalid": "photoUrlInvalid",
  "agent.id.invalid": "idInvalid",
};

const CONFIRMATION_KEY_MAP: Record<string, string> = {
  "confirmation.agentId.invalid": "agentIdInvalid",
  "confirmation.productId.invalid": "productIdInvalid",
  "confirmation.date.invalid": "dateInvalid",
  "confirmation.field.integer": "fieldInteger",
  "confirmation.field.nonNeg": "fieldNonNeg",
  "confirmation.field.tooLarge": "fieldTooLarge",
  "confirmation.patch.empty": "patchEmpty",
};

export function useResolveValidationError(): (key: string) => string {
  const tAgent = useTranslations("errors.agent");
  const tConfirmation = useTranslations("errors.confirmation");
  return (key: string) => {
    const agentSub = AGENT_KEY_MAP[key];
    if (agentSub) return tAgent(agentSub);
    const confSub = CONFIRMATION_KEY_MAP[key];
    if (confSub) return tConfirmation(confSub);
    return key;
  };
}
