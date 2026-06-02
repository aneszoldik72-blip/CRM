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
import type { EntryValues } from "@/lib/validators/entry";

import type { SectionProps } from "./sales-section";

const FIELDS = [
  { name: "ads_spend_cents", label: "Pub" },
  { name: "test_spend_cents", label: "Tests" },
  { name: "product_cost_cents", label: "Coût produit" },
  { name: "service_cost_cents", label: "Livraison" },
  { name: "bonus_cents", label: "Bonus agents" },
  { name: "ad_account_cents", label: "Comptes pub" },
] as const;

export function CostsSection({ currency, onFieldChange }: SectionProps) {
  const form = useFormContext<EntryValues>();

  return (
    <section className="grid gap-4">
      <h2 className="text-base font-semibold tracking-tight">Coûts</h2>

      {FIELDS.map((f) => (
        <FormField
          key={f.name}
          control={form.control}
          name={f.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {f.label} ({currency})
              </FormLabel>
              <FormControl>
                <CurrencyInput
                  valueCents={field.value as number}
                  onChangeCents={(c) => {
                    field.onChange(c);
                    onFieldChange(f.name, c);
                  }}
                  currency={currency}
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
