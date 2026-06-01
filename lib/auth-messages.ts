// Maps stable validator error keys (e.g. "auth.password.tooShort") to French
// strings shown in the UI. Replace with next-intl lookups when i18n lands.
const MESSAGES: Record<string, string> = {
  "auth.email.required": "Email requis.",
  "auth.email.invalid": "Email invalide.",
  "auth.password.required": "Mot de passe requis.",
  "auth.password.tooShort": "Au moins 8 caractères.",
  "auth.password.mismatch": "Les mots de passe ne sont pas identiques.",
  "auth.fullName.tooLong": "Nom trop long.",
  "auth.signin.invalidCredentials": "Email ou mot de passe incorrect.",
};

export function resolveAuthError(key: string): string {
  return MESSAGES[key] ?? key;
}
