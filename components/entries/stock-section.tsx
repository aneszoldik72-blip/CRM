"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("entries.stock");
  const form = useFormContext<EntryValues>();

  return (
    <section className="grid gap-4">
      <h2 className="text-base font-semibold tracking-tight">{t("title")}</h2>

      <FormField
        control={form.control}
        name="initial_stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("initial")}</FormLabel>
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
            <FormLabel>{t("current")}</FormLabel>
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
