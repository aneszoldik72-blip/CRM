"use client";

import { useTranslations } from "next-intl";

import { CURRENCIES, type CurrencyCode } from "@/lib/data/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySelect({
  value,
  onChange,
  invalid,
  id,
}: {
  value: CurrencyCode | null;
  onChange: (code: CurrencyCode) => void;
  invalid?: boolean;
  id?: string;
}) {
  const t = useTranslations("products");
  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => onChange(v as CurrencyCode)}
    >
      <SelectTrigger
        id={id}
        aria-invalid={invalid || undefined}
        className="h-11 w-full"
      >
        <SelectValue placeholder={t("currencyPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
