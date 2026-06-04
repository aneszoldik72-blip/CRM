import "server-only";

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "MAD",
  "DZD",
  "TND",
  "XOF",
  "NGN",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export type Rates = {
  base: "USD";
  rates: Record<string, number>;
  fetchedAt: string;
  stale: boolean;
};

const IDENTITY_RATES: Rates["rates"] = SUPPORTED_CURRENCIES.reduce(
  (acc, c) => {
    acc[c] = 1;
    return acc;
  },
  {} as Record<string, number>,
);

const STALE_FALLBACK: Rates = {
  base: "USD",
  rates: IDENTITY_RATES,
  fetchedAt: new Date(0).toISOString(),
  stale: true,
};

// Fetches USD-based rates from open.er-api.com. Cached for 24h via Next.js
// fetch cache — no extra infra needed. Returns stale identity rates on any
// failure so the dashboard still renders.
export async function getRates(): Promise<Rates> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return STALE_FALLBACK;
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    if (data.result !== "success" || !data.rates) return STALE_FALLBACK;
    return {
      base: "USD",
      rates: data.rates,
      fetchedAt: data.time_last_update_utc ?? new Date().toISOString(),
      stale: false,
    };
  } catch {
    return STALE_FALLBACK;
  }
}

// Converts cents from one currency to another. Returns 0 if either side is
// missing from the rate table.
export function convertCents(
  cents: number,
  from: string,
  to: string,
  rates: Rates,
): number {
  if (from === to) return cents;
  const fromRate = rates.rates[from];
  const toRate = rates.rates[to];
  if (!fromRate || !toRate) return 0;
  return Math.round((cents / fromRate) * toRate);
}
