"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type CurrencyInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type"
> & {
  valueCents: number;
  onChangeCents: (cents: number) => void;
  currency: string;
};

function formatDisplay(cents: number): string {
  if (cents === 0) return "0";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function rawDisplay(cents: number): string {
  if (cents === 0) return "";
  const value = cents / 100;
  return String(value).replace(".", ",");
}

// Returns cents on success, null on parse failure. Empty string = 0.
function parseCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  const cleaned = trimmed
    .replace(/[\s  ]/g, "")
    .replace(",", ".");
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function CurrencyInput({
  valueCents,
  onChangeCents,
  currency,
  className,
  onFocus,
  onBlur,
  ...rest
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string>(() => formatDisplay(valueCents));

  // Sync external value to display when NOT focused.
  useEffect(() => {
    if (!focused) setDraft(formatDisplay(valueCents));
  }, [valueCents, focused]);

  return (
    <div className="relative">
      <Input
        {...rest}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={draft}
        onChange={(e) => {
          const filtered = e.target.value.replace(/[^\d.,\s ]/g, "");
          setDraft(filtered);
          const cents = parseCents(filtered);
          if (cents !== null && cents !== valueCents) {
            onChangeCents(cents);
          }
        }}
        onFocus={(e) => {
          setFocused(true);
          setDraft(rawDisplay(valueCents));
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          const cents = parseCents(draft);
          if (cents === null) {
            // Invalid — revert to last valid display.
            setDraft(formatDisplay(valueCents));
          } else {
            setDraft(formatDisplay(cents));
            if (cents !== valueCents) onChangeCents(cents);
          }
          onBlur?.(e);
        }}
        className={cn("h-11 pe-14", className)}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase text-muted-foreground"
      >
        {currency}
      </span>
    </div>
  );
}
