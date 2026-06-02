"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { IntegerInput } from "@/components/inputs/integer-input";
import type { EntryField, EntryValues } from "@/lib/validators/entry";

export function StockSection({
  onFieldChange,
}: {
  onFieldChange: (field: EntryField, value: number | null) => void;
}) {
  const form = useFormContext<EntryValues>();

  return (
    <section className="grid gap-4">
      <h2 className="text-base font-semibold tracking-tight">Stock</h2>

      <FormField
        control={form.control}
        name="initial_stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stock initial</FormLabel>
            <FormControl>
              <IntegerInput
                value={field.value ?? null}
                onChange={(v) => {
                  field.onChange(v);
                  onFieldChange("initial_stock", v);
                }}
                nullable
                enterKeyHint="next"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="current_stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stock actuel</FormLabel>
            <FormControl>
              <IntegerInput
                value={field.value ?? null}
                onChange={(v) => {
                  field.onChange(v);
                  onFieldChange("current_stock", v);
                }}
                nullable
                enterKeyHint="done"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
}
