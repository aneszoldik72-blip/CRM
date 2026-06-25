"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { EntryField, EntryValues } from "@/lib/validators/entry";

type Props = {
  field: Extract<EntryField, "sales_currency" | "costs_currency">;
  label: string;
  onFieldChange: (
    field: EntryField,
    value: number | string | null,
  ) => void;
};

export function SectionCurrencySelector({ field, label, onFieldChange }: Props) {
  const form = useFormContext<EntryValues>();

  return (
    <FormField
      control={form.control}
      name={field}
      render={({ field: f }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={f.value as string}
            onValueChange={(v) => {
              f.onChange(v);
              onFieldChange(field, v);
            }}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
