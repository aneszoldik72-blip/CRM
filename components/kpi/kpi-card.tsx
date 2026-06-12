"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { bcp47, type AppLocale } from "@/i18n/routing";
import {
  formatCurrency,
  formatDays,
  formatMultiplier,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import type { MetricValue } from "@/lib/metrics";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type KpiCardProps = {
  label: string;
  value: MetricValue;
  formula: string;
  variant: "primary" | "secondary";
  currency: string;
  /** Optional sub-label, replaces the default formula hint on primary cards. */
  hint?: string;
};

function placeholder(kind: MetricValue["kind"]): string {
  switch (kind) {
    case "currency":
      return "— ";
    case "percent":
      return "— %";
    case "multiplier":
      return "— ×";
    case "days":
      return "— j";
    case "count":
      return "—";
  }
}

function format(value: MetricValue, currency: string, locale: string): string {
  if (value.value === null) {
    const body = placeholder(value.kind);
    return value.kind === "currency" ? `${body}${currency}` : body;
  }
  switch (value.kind) {
    case "currency":
      return formatCurrency(value.value, currency, locale);
    case "percent":
      return formatPercent(value.value, locale);
    case "multiplier":
      return formatMultiplier(value.value, locale);
    case "days":
      return formatDays(Math.round(value.value), locale);
    case "count":
      return formatNumber(value.value, locale);
  }
}

function signPrefix(value: MetricValue): ReactNode {
  if (value.value === null) return null;
  if (value.kind !== "currency") return null;
  if (value.tone === "good" && value.value > 0)
    return (
      <span aria-hidden className="me-1">
        ▲
      </span>
    );
  if (value.tone === "bad" && value.value < 0)
    return (
      <span aria-hidden className="me-1">
        ▼
      </span>
    );
  return null;
}

export function KpiCard({
  label,
  value,
  formula,
  variant,
  currency,
  hint,
}: KpiCardProps) {
  const tTone = useTranslations("metrics.tone");
  const tMetrics = useTranslations("metrics");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);

  const isPrimary = variant === "primary";
  const isCritical = value.tone === "critical";
  const toneClass = cn(
    value.tone === "good" && "text-emerald-500",
    (value.tone === "bad" || value.tone === "critical") && "text-destructive",
  );
  const formatted = format(value, currency, bcp);
  const ariaTone =
    value.tone === "good"
      ? tTone("good")
      : value.tone === "bad"
        ? tTone("bad")
        : value.tone === "critical"
          ? tTone("critical")
          : "";
  const ariaLabel = `${label} : ${formatted}${ariaTone ? `, ${ariaTone}` : ""}`;

  const valueClasses = cn(
    "truncate font-semibold tabular-nums",
    isPrimary ? "text-2xl" : "text-base",
    toneClass,
  );

  return (
    <article
      role="figure"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card transition-colors",
        isPrimary ? "gap-2 p-4 sm:gap-3" : "gap-1 p-3",
        isCritical && "border-destructive",
      )}
    >
      <p
        className={cn(
          "uppercase tracking-wide text-muted-foreground",
          isPrimary ? "text-[11px]" : "text-[10px]",
        )}
      >
        {label}
      </p>

      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              className={cn("inline-flex w-fit items-center", valueClasses)}
            />
          }
        >
          {signPrefix(value)}
          {formatted}
        </TooltipTrigger>
        <TooltipContent side="top">{formula}</TooltipContent>
      </Tooltip>

      {isPrimary && (
        <p className="text-[11px] text-muted-foreground">{hint ?? formula}</p>
      )}
      {isCritical && !isPrimary && (
        <p className="text-[10px] font-medium text-destructive">
          {tMetrics("outOfStockSoon")}
        </p>
      )}
    </article>
  );
}
