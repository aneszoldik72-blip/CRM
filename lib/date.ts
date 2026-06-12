// Returns "Janvier 2026" for "2026-01" (capitalized; default fr-FR).
// Callers pass a BCP-47 tag (e.g. "ar-MA") from i18n/routing#bcp47.
export function formatMonthLabel(yyyymm: string, locale = "fr-FR"): string {
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m) return yyyymm;
  const d = new Date(Date.UTC(y, m - 1, 1));
  const formatted = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    numberingSystem: "latn",
  }).format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Returns "1 févr. – 28 févr. 2026".
export function formatMonthRange(
  yyyymm: string,
  locale = "fr-FR",
): string {
  const range = monthBounds(yyyymm);
  if (!range) return "";
  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    numberingSystem: "latn",
  });
  const yearFmt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    timeZone: "UTC",
    numberingSystem: "latn",
  });
  return `${fmt.format(new Date(range.start))} – ${fmt.format(new Date(range.end))} ${yearFmt.format(new Date(range.end))}`;
}

// Returns ISO date strings for the first and last day of a YYYY-MM month.
export function monthBounds(
  yyyymm: string,
): { start: string; end: string } | null {
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

// Derives "YYYY-MM" from an ISO date string ("2026-01-01" → "2026-01").
export function yyyymmFromDate(iso: string): string {
  return iso.slice(0, 7);
}

// Returns the YYYY-MM of the current calendar month (UTC).
export function currentYyyymm(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Returns the YYYY-MM that follows the given one (e.g. "2026-12" → "2027-01").
export function nextYyyymm(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m) return yyyymm;
  const date = new Date(Date.UTC(y, m, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Returns the YYYY-MM that precedes the given one (e.g. "2026-01" → "2025-12").
export function prevYyyymm(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m) return yyyymm;
  const date = new Date(Date.UTC(y, m - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
