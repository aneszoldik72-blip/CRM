"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
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

function format(value: MetricValue, currency: string): string {
  if (value.value === null) {
    const body = placeholder(value.kind);
    return value.kind === "currency" ? `${body}${currency}` : body;
  }
  switch (value.kind) {
    case "currency":
      return formatCurrency(value.value, currency);
    case "percent":
      return formatPercent(value.value);
    case "multiplier":
      return formatMultiplier(value.value);
    case "days":
      return formatDays(Math.round(value.value));
    case "count":
      return formatNumber(value.value);
  }
}

function ariaState(tone: MetricValue["tone"]): string {
  switch (tone) {
    case "good":
      return "positif";
    case "bad":
      return "négatif";
    case "critical":
      return "critique";
    case "neutral":
      return "";
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
  const isPrimary = variant === "primary";
  const isCritical = value.tone === "critical";
  const toneClass = cn(
    value.tone === "good" && "text-emerald-500",
    (value.tone === "bad" || value.tone === "critical") && "text-destructive",
  );
  const formatted = format(value, currency);
  const ariaTone = ariaState(value.tone);
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
        <p className="text-[11px] text-muted-foreground">
          {hint ?? formula}
        </p>
      )}
      {isCritical && !isPrimary && (
        <p className="text-[10px] font-medium text-destructive">
          Rupture proche
        </p>
      )}
    </article>
  );
}
