"use client";

import { useTranslations } from "next-intl";

// Server-side validators emit stable error keys (e.g. "auth.password.tooShort").
// Map them to localized strings via the auth.errors namespace.
const KEY_MAP: Record<string, string> = {
  "auth.email.required": "emailRequired",
  "auth.email.invalid": "emailInvalid",
  "auth.password.required": "passwordRequired",
  "auth.password.tooShort": "passwordTooShort",
  "auth.password.mismatch": "passwordMismatch",
  "auth.fullName.tooLong": "fullNameTooLong",
  "auth.signin.invalidCredentials": "invalidCredentials",
  "auth.rateLimit": "rateLimit",
};

export function useResolveAuthError(): (key: string) => string {
  const t = useTranslations("auth.errors");
  return (key: string) => {
    const sub = KEY_MAP[key];
    if (sub) return t(sub);
    return key;
  };
}
