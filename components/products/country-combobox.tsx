"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { COUNTRIES, getCountry } from "@/lib/data/countries";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function CountryCombobox({
  value,
  onChange,
  invalid,
  id,
}: {
  value: string | null;
  onChange: (code: string) => void;
  invalid?: boolean;
  id?: string;
}) {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);
  const selected = getCountry(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid || undefined}
            aria-expanded={open}
            className="h-11 w-full justify-between px-3 font-normal"
          />
        }
      >
        {selected ? (
          <span className="flex items-center gap-2 text-foreground">
            <span aria-hidden className="text-base leading-none">
              {selected.flag}
            </span>
            <span>{selected.name}</span>
            <span className="text-xs text-muted-foreground">
              ({selected.code})
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{t("countryPlaceholder")}</span>
        )}
        <ChevronsUpDown className="ms-2 size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("countrySearchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{t("countryEmpty")}</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => {
                const isSelected = selected?.code === c.code;
                return (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.code}`}
                    onSelect={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    data-checked={isSelected || undefined}
                  >
                    <span aria-hidden className="text-base leading-none">
                      {c.flag}
                    </span>
                    <span>{c.name}</span>
                    <span className="ms-auto text-xs text-muted-foreground">
                      {c.code}
                    </span>
                    <Check
                      className={cn(
                        "size-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
