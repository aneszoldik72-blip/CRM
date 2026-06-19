"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type IntegerInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type"
> & {
  value: number | null;
  onChange: (value: number | null) => void;
  nullable?: boolean;
};

export function IntegerInput({
  value,
  onChange,
  nullable,
  className,
  onFocus,
  onBlur,
  ...rest
}: IntegerInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string>(
    value == null ? "" : String(value),
  );

  useEffect(() => {
    if (!focused) setDraft(value == null ? "" : String(value));
  }, [value, focused]);

  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={draft}
      onChange={(e) => {
        const filtered = e.target.value.replace(/\D/g, "");
        setDraft(filtered);
        if (filtered === "") {
          onChange(nullable ? null : 0);
        } else {
          const n = parseInt(filtered, 10);
          if (Number.isFinite(n)) onChange(n);
        }
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        setDraft(value == null ? "" : String(value));
        onBlur?.(e);
      }}
      className={cn("h-11", className)}
    />
  );
}
