// All formatters are pure and locale-aware. Default locale matches the app
// default ("fr-FR"); callers can override when i18n lands.

const DEFAULT_LOCALE = "fr-FR";

function numberFmt(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, options);
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
