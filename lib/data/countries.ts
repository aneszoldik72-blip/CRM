export type CurrencyCode =
  | "USD"
  | "EUR"
  | "MAD"
  | "DZD"
  | "TND"
  | "XOF"
  | "NGN";

export type Country = {
  code: string;
  name: string;
  flag: string;
  defaultCurrency: CurrencyCode;
};

// West Africa first (largest COD market for the target audience), then North
// Africa, then other African markets, then diaspora destinations. Countries
// whose real currency isn't in our 7-currency MVP set default to USD.
export const COUNTRIES: Country[] = [
  // West Africa (XOF zone + Nigeria)
  { code: "SN", name: "Sénégal", flag: "🇸🇳", defaultCurrency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", defaultCurrency: "XOF" },
  { code: "ML", name: "Mali", flag: "🇲🇱", defaultCurrency: "XOF" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", defaultCurrency: "XOF" },
  { code: "NE", name: "Niger", flag: "🇳🇪", defaultCurrency: "XOF" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", defaultCurrency: "XOF" },
  { code: "TG", name: "Togo", flag: "🇹🇬", defaultCurrency: "XOF" },
  { code: "GN", name: "Guinée", flag: "🇬🇳", defaultCurrency: "USD" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", defaultCurrency: "USD" },
  { code: "NG", name: "Nigéria", flag: "🇳🇬", defaultCurrency: "NGN" },

  // North Africa
  { code: "MA", name: "Maroc", flag: "🇲🇦", defaultCurrency: "MAD" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", defaultCurrency: "DZD" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", defaultCurrency: "TND" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", defaultCurrency: "USD" },
  { code: "LY", name: "Libye", flag: "🇱🇾", defaultCurrency: "USD" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷", defaultCurrency: "USD" },

  // Central / Other Africa
  { code: "CM", name: "Cameroun", flag: "🇨🇲", defaultCurrency: "USD" },
  { code: "CD", name: "Congo (RDC)", flag: "🇨🇩", defaultCurrency: "USD" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", defaultCurrency: "USD" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦", defaultCurrency: "USD" },

  // Diaspora
  { code: "FR", name: "France", flag: "🇫🇷", defaultCurrency: "EUR" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", defaultCurrency: "EUR" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", defaultCurrency: "EUR" },
  { code: "IT", name: "Italie", flag: "🇮🇹", defaultCurrency: "EUR" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", defaultCurrency: "USD" },
  { code: "CA", name: "Canada", flag: "🇨🇦", defaultCurrency: "USD" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", defaultCurrency: "USD" },
];

export const COUNTRY_BY_CODE = new Map<string, Country>(
  COUNTRIES.map((c) => [c.code, c]),
);

export function getCountry(code: string | null | undefined): Country | null {
  if (!code) return null;
  return COUNTRY_BY_CODE.get(code.toUpperCase()) ?? null;
}

export type Currency = {
  code: CurrencyCode;
  label: string;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", label: "USD — Dollar US" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "MAD", label: "MAD — Dirham marocain" },
  { code: "DZD", label: "DZD — Dinar algérien" },
  { code: "TND", label: "TND — Dinar tunisien" },
  { code: "XOF", label: "XOF — Franc CFA (UEMOA)" },
  { code: "NGN", label: "NGN — Naira" },
];
