"use client";

import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";

import { cn } from "@/lib/utils";
import type { EntryValues } from "@/lib/validators/entry";

function formatCurrency(cents: number, currency: string): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents) / 100;
  const num = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign}${num} ${currency}`;
}

export function LiveKpis({
  control,
  currency,
}: {
  control: Control<EntryValues>;
  currency: string;
}) {
  const values = useWatch({ control });

  const { profitCents, roas, marge } = useMemo(() => {
    const v = values as EntryValues;
    const revenue = v.revenue_cents ?? 0;
    const costs =
      (v.ads_spend_cents ?? 0) +
      (v.test_spend_cents ?? 0) +
      (v.ad_account_cents ?? 0) +
      (v.product_cost_cents ?? 0) +
      (v.service_cost_cents ?? 0) +
      (v.bonus_cents ?? 0);
    const profit = revenue - costs;
    const ads = v.ads_spend_cents ?? 0;
    const roasVal = ads > 0 ? revenue / ads : null;
    const margeVal = revenue > 0 ? profit / revenue : null;
    return { profitCents: profit, roas: roasVal, marge: margeVal };
  }, [values]);

  return (
    <div
      aria-live="polite"
      className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-2"
    >
      <Card
        label="Profit"
        value={formatCurrency(profitCents, currency)}
        tone={profitCents < 0 ? "bad" : profitCents > 0 ? "good" : "neutral"}
      />
      <Card
        label="ROAS"
        value={roas == null ? "—" : `${roas.toFixed(2).replace(".", ",")}×`}
        tone={roas == null ? "neutral" : roas >= 2 ? "good" : roas < 1 ? "bad" : "neutral"}
      />
      <Card
        label="Marge"
        value={marge == null ? "—" : `${Math.round(marge * 100)} %`}
        tone={marge == null ? "neutral" : marge < 0 ? "bad" : marge >= 0.2 ? "good" : "neutral"}
      />
    </div>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "truncate text-sm font-semibold tabular-nums",
          tone === "good" && "text-emerald-500",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}
