"use client";

import { useState } from "react";
import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Locale = "fr" | "ar" | "en";

const LOCALES: { key: Locale; label: string }[] = [
  { key: "fr", label: "Français" },
  { key: "ar", label: "العربية" },
  { key: "en", label: "English" },
];

export function LanguageSwitcher() {
  // Placeholder — real switching lands with next-intl.
  const [locale, setLocale] = useState<Locale>("fr");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Changer la langue"
          />
        }
      >
        <Globe className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.key}
            onClick={() => setLocale(l.key)}
            className="justify-between"
          >
            <span>{l.label}</span>
            {locale === l.key && (
              <Check className="size-3.5 text-primary" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
