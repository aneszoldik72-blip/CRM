"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { bcp47, type AppLocale } from "@/i18n/routing";
import {
  formatCurrency,
  formatMultiplier,
  formatPercent,
} from "@/lib/format";
import { computeMetrics } from "@/lib/metrics";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/inputs/currency-input";
import { IntegerInput } from "@/components/inputs/integer-input";
import { Label } from "@/components/ui/label";

export type EntryStepValue = {
  leads: number;
  orders: number;
  delivered: number;
  revenue_cents: number;
  ads_spend_cents: number;
  test_spend_cents: number;
  ad_account_cents: number;
  product_cost_cents: number;
  service_cost_cents: number;
  bonus_cents: number;
  // entrySchema requires these keys to be present (nullable but not
  // optional). Onboarding never asks for stock — we always send null.
  initial_stock: number | null;
  current_stock: number | null;
};

export type StepFirstEntryProps = {
  value: EntryStepValue;
  currency: string;
  onChange: (next: EntryStepValue) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export function StepFirstEntry({
  value,
  currency,
  onChange,
  onNext,
  onBack,
  onSkip,
}: StepFirstEntryProps) {
  const t = useTranslations("onboarding");
  const tEntry = useTranslations("onboarding.entry");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);

  const [moreOpen, setMoreOpen] = useState(false);

  const metrics = useMemo(
    () =>
      computeMetrics({
        ...value,
        initial_stock: null,
        current_stock: null,
        daysElapsed: null,
      }),
    [value],
  );

  function setField<K extends keyof EntryStepValue>(
    key: K,
    next: EntryStepValue[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">
          {tEntry("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{tEntry("sub")}</p>
      </header>

      <div className="grid gap-5">
        <CountField
          label={tEntry("leadsLabel")}
          help={tEntry("leadsHelp")}
          value={value.leads}
          onChange={(v) => setField("leads", v)}
          autoFocus
        />
        <CountField
          label={tEntry("ordersLabel")}
          help={tEntry("ordersHelp")}
          value={value.orders}
          onChange={(v) => setField("orders", v)}
        />
        <CountField
          label={tEntry("deliveredLabel")}
          help={tEntry("deliveredHelp")}
          value={value.delivered}
          onChange={(v) => setField("delivered", v)}
        />
        <MoneyField
          label={tEntry("revenueLabel", { currency })}
          help={tEntry("revenueHelp")}
          currency={currency}
          value={value.revenue_cents}
          onChange={(v) => setField("revenue_cents", v)}
        />
        <MoneyField
          label={tEntry("adsSpendLabel", { currency })}
          help={tEntry("adsSpendHelp")}
          currency={currency}
          value={value.ads_spend_cents}
          onChange={(v) => setField("ads_spend_cents", v)}
        />

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="flex items-center gap-1.5 self-start text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              moreOpen && "rotate-180",
            )}
          />
          {tEntry("moreCosts")}
        </button>

        {moreOpen && (
          <div className="grid gap-5">
            <MoneyField
              label={tEntry("testSpendLabel", { currency })}
              currency={currency}
              value={value.test_spend_cents}
              onChange={(v) => setField("test_spend_cents", v)}
            />
            <MoneyField
              label={tEntry("productCostLabel", { currency })}
              currency={currency}
              value={value.product_cost_cents}
              onChange={(v) => setField("product_cost_cents", v)}
            />
            <MoneyField
              label={tEntry("serviceCostLabel", { currency })}
              currency={currency}
              value={value.service_cost_cents}
              onChange={(v) => setField("service_cost_cents", v)}
            />
          </div>
        )}
      </div>

      <section
        aria-label={tEntry("preview")}
        className="grid gap-3 rounded-xl border border-border bg-card p-4"
      >
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {tEntry("preview")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PreviewKpi
            label={tEntry("kpiNetProfit")}
            value={
              metrics.netProfit.value === null
                ? "—"
                : formatCurrency(metrics.netProfit.value, currency, bcp)
            }
            tone={metrics.netProfit.tone}
          />
          <PreviewKpi
            label={tEntry("kpiMargin")}
            value={
              metrics.margin.value === null
                ? "—"
                : formatPercent(metrics.margin.value, bcp)
            }
            tone={metrics.margin.tone}
          />
          <PreviewKpi
            label={tEntry("kpiRoas")}
            value={
              metrics.roas.value === null
                ? "—"
                : formatMultiplier(metrics.roas.value, bcp)
            }
            tone={metrics.roas.tone}
          />
          <PreviewKpi
            label={tEntry("kpiDelivery")}
            value={
              metrics.deliveryRate.value === null
                ? "—"
                : formatPercent(metrics.deliveryRate.value, bcp)
            }
            tone={metrics.deliveryRate.tone}
          />
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-3">
        <Button
          type="button"
          onClick={onNext}
          className="h-12 w-full text-base"
        >
          {t("continue")}
        </Button>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {t("back")}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("skip")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CountField({
  label,
  help,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  help?: string;
  value: number;
  onChange: (v: number) => void;
  autoFocus?: boolean;
}) {
  // Plain controlled field — no react-hook-form context in the onboarding
  // tree, so we can't use shadcn's <FormItem>/<FormLabel>/<FormControl>
  // here (they call useFormContext() and would null-crash on render).
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <IntegerInput
        value={value}
        onChange={(v) => onChange(v ?? 0)}
        autoFocus={autoFocus}
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function MoneyField({
  label,
  help,
  currency,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  currency: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <CurrencyInput
        valueCents={value}
        onChangeCents={onChange}
        currency={currency}
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function PreviewKpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "critical" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-base font-semibold tabular-nums transition-colors duration-200",
          tone === "good" && "text-emerald-500",
          (tone === "bad" || tone === "critical") && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}
