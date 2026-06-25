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
import { IntegerInput } from "@/components/inputs/integer-input";
import type { EntryField, EntryValues } from "@/lib/validators/entry";

import { SectionCurrencySelector } from "./section-currency-selector";

export type SectionProps = {
  /** Fallback currency label when the per-section currency isn't yet
   * resolved (mostly a safety net — the form always provides a value). */
  currency: string;
  onFieldChange: (
    field: EntryField,
    value: number | string | null,
  ) => void;
};

export function SalesSection({ currency, onFieldChange }: SectionProps) {
  const t = useTranslations("entries.sales");
  const tCurrency = useTranslations("entries");
  const form = useFormContext<EntryValues>();
  const salesCurrency =
    (useWatch({ control: form.control, name: "sales_currency" }) as
      | string
      | undefined) ?? currency;

  return (
    <section className="grid gap-4">
      <h2 className="text-base font-semibold tracking-tight">{t("title")}</h2>

      <SectionCurrencySelector
        field="sales_currency"
        label={tCurrency("salesCurrency")}
        onFieldChange={onFieldChange}
      />

      <FormField
        control={form.control}
        name="leads"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("leads")}</FormLabel>
            <FormControl>
              <IntegerInput
                value={field.value as number}
                onChange={(v) => {
                  field.onChange(v);
                  onFieldChange("leads", v);
                }}
                enterKeyHint="next"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="orders"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("orders")}</FormLabel>
            <FormControl>
              <IntegerInput
                value={field.value as number}
                onChange={(v) => {
                  field.onChange(v);
                  onFieldChange("orders", v);
                }}
                enterKeyHint="next"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="delivered"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("delivered")}</FormLabel>
            <FormControl>
              <IntegerInput
                value={field.value as number}
                onChange={(v) => {
                  field.onChange(v);
                  onFieldChange("delivered", v);
                }}
                enterKeyHint="next"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="revenue_cents"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("revenue", { currency: salesCurrency })}</FormLabel>
            <FormControl>
              <CurrencyInput
                valueCents={field.value as number}
                onChangeCents={(c) => {
                  field.onChange(c);
                  onFieldChange("revenue_cents", c);
                }}
                currency={salesCurrency}
                enterKeyHint="next"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
}
