// All formatters are pure and locale-aware. Default locale matches the app
// default ("fr-FR"); callers pass the current request locale (BCP-47 tag)
// from i18n/routing#bcp47.

const DEFAULT_LOCALE = "fr-FR";

// Arabic locales render digits as Arabic-Indic by default, which misaligns
// tabular columns. Force Latin digits in number/currency output to match the
// rest of the UI.
function numberFmt(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { numberingSystem: "latn", ...options });
}

export function formatCurrency(
  cents: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
): string {
  const value = cents / 100;
  const hasDecimals = Math.abs(value - Math.trunc(value)) > 1e-9;
  const formatted = numberFmt(locale, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${currency}`;
}

export function formatPercent(
  ratio: number,
  locale: string = DEFAULT_LOCALE,
  fractionDigits = 0,
): string {
  const formatted = numberFmt(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio * 100);
  return `${formatted} %`;
}

export function formatNumber(
  n: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return numberFmt(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMultiplier(
  n: number,
  locale: string = DEFAULT_LOCALE,
): string {
  const formatted = numberFmt(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} ×`;
}

export function formatDays(
  n: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return `${numberFmt(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)} j`;
}

// Compact currency for cramped axis labels. 12 345 67 cents → "1,2 M MAD",
// 123 450 cents → "1,2 K MAD", 4 500 cents → "45 MAD".
export function formatCurrencyShort(
  cents: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
): string {
  const value = cents / 100;
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  let body: string;
  if (abs >= 1_000_000) {
    body = `${numberFmt(locale, {
      minimumFractionDigits: abs >= 10_000_000 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(abs / 1_000_000)} M`;
  } else if (abs >= 1_000) {
    body = `${numberFmt(locale, {
      minimumFractionDigits: abs >= 10_000 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(abs / 1_000)} K`;
  } else {
    body = numberFmt(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(abs);
  }
  return `${sign}${body} ${currency}`;
}
