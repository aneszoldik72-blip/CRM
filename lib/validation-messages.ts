"use client";

import { useTranslations } from "next-intl";

// Stable validator error keys → translation keys under errors.{agent,confirmation,settings}.*
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

const SETTINGS_KEY_MAP: Record<string, string> = {
  "settings.fullName.tooLong": "fullNameTooLong",
  "settings.country.invalid": "countryInvalid",
  "settings.patch.empty": "patchEmpty",
  "settings.email.required": "emailRequired",
  "settings.email.invalid": "emailInvalid",
  "settings.email.sameAsCurrent": "emailSameAsCurrent",
  "settings.password.currentRequired": "passwordCurrentRequired",
  "settings.password.currentWrong": "passwordCurrentWrong",
  "settings.password.tooShort": "passwordTooShort",
  "settings.password.confirmRequired": "passwordConfirmRequired",
  "settings.password.mismatch": "passwordMismatch",
  "settings.delete.confirmationMismatch": "deleteConfirmationMismatch",
};

export function useResolveValidationError(): (key: string) => string {
  const tAgent = useTranslations("errors.agent");
  const tConfirmation = useTranslations("errors.confirmation");
  const tSettings = useTranslations("errors.settings");
  return (key: string) => {
    const agentSub = AGENT_KEY_MAP[key];
    if (agentSub) return tAgent(agentSub);
    const confSub = CONFIRMATION_KEY_MAP[key];
    if (confSub) return tConfirmation(confSub);
    const settingsSub = SETTINGS_KEY_MAP[key];
    if (settingsSub) return tSettings(settingsSub);
    return key;
  };
}
