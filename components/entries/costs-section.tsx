"use client";

import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CurrencyInput } from "@/components/inputs/currency-input";
import type { EntryValues } from "@/lib/validators/entry";

import type { SectionProps } from "./sales-section";
import { SectionCurrencySelector } from "./section-currency-selector";

const FIELDS = [
  { name: "ads_spend_cents", labelKey: "ads" },
  { name: "test_spend_cents", labelKey: "tests" },
  { name: "product_cost_cents", labelKey: "product" },
  { name: "service_cost_cents", labelKey: "delivery" },
] as const;

export function CostsSection({ currency, onFieldChange }: SectionProps) {
  const t = useTranslations("entries.costs");
  const tCurrency = useTranslations("entries");
  const form = useFormContext<EntryValues>();
  const costsCurrency =
    (useWatch({ control: form.control, name: "costs_currency" }) as
      | string
      | undefined) ?? currency;

  return (
    <section className="grid gap-4">
      <h2 className="text-base font-semibold tracking-tight">{t("title")}</h2>

      <SectionCurrencySelector
        field="costs_currency"
        label={tCurrency("costsCurrency")}
        onFieldChange={onFieldChange}
      />

      {FIELDS.map((f) => (
        <FormField
          key={f.name}
          control={form.control}
          name={f.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t(f.labelKey)} ({costsCurrency})
              </FormLabel>
              <FormControl>
                <CurrencyInput
                  valueCents={field.value as number}
                  onChangeCents={(c) => {
                    field.onChange(c);
                    onFieldChange(f.name, c);
                  }}
                  currency={costsCurrency}
                  enterKeyHint="next"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </section>
  );
}
