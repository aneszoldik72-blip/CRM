import { z } from "zod";

// The 6 currencies the dashboard switcher offers as a base view. NGN stays
// available as a product currency (and is converted into whichever of these
// the user picks) but isn't a selectable base.
export const BASE_CURRENCIES = [
  "USD",
  "MAD",
  "XOF",
  "EUR",
  "DZD",
  "TND",
] as const;

export type BaseCurrency = (typeof BASE_CURRENCIES)[number];

export const baseCurrencySchema = z.enum(BASE_CURRENCIES, {
  message: "Devise invalide.",
});

export function isBaseCurrency(value: unknown): value is BaseCurrency {
  return (
    typeof value === "string" &&
    (BASE_CURRENCIES as readonly string[]).includes(value)
  );
}
