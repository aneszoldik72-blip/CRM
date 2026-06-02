"use client";

import { useFormContext } from "react-hook-form";

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

export type SectionProps = {
  currency: string;
  onFieldChange: (field: EntryField, value: number | null) => void;
};

export function SalesSection({ currency, onFieldChange }: SectionProps) {
  const form = useFormContext<EntryValues>();

  return (
    <section className="grid gap-4">
      <h2 className="text-base font-semibold tracking-tight">Ventes</h2>

      <FormField
        control={form.control}
        name="leads"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Leads</FormLabel>
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
            <FormLabel>Commandes</FormLabel>
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
            <FormLabel>Livrées</FormLabel>
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
            <FormLabel>Chiffre d&apos;affaires ({currency})</FormLabel>
            <FormControl>
              <CurrencyInput
                valueCents={field.value as number}
                onChangeCents={(c) => {
                  field.onChange(c);
                  onFieldChange("revenue_cents", c);
                }}
                currency={currency}
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
