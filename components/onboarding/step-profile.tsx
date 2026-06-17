"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import { getCountry, type CurrencyCode } from "@/lib/data/countries";
import {
  BASE_CURRENCIES,
  type BaseCurrency,
} from "@/lib/validators/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryCombobox } from "@/components/products/country-combobox";

export type ProfileStepValue = {
  full_name: string;
  country: string;
  default_currency: BaseCurrency;
};

export type StepProfileProps = {
  value: ProfileStepValue;
  onChange: (next: ProfileStepValue) => void;
  onNext: () => void;
  onSkip: () => void;
};

export function StepProfile({
  value,
  onChange,
  onNext,
  onSkip,
}: StepProfileProps) {
  const t = useTranslations("onboarding");
  const tProfile = useTranslations("onboarding.profile");

  // Same pattern as ProductForm: currency tracks country until the user
  // touches the currency selector manually.
  const userTouchedCurrency = useRef(false);

  function setFullName(s: string) {
    onChange({ ...value, full_name: s });
  }

  function setCountry(code: string) {
    const country = getCountry(code);
    if (country && !userTouchedCurrency.current) {
      const cur = country.defaultCurrency as CurrencyCode;
      // Only inherit if the country's default is a BASE currency. Otherwise
      // leave the user on their current selection (the BASE_CURRENCIES list
      // doesn't include NGN, for instance).
      if ((BASE_CURRENCIES as readonly string[]).includes(cur)) {
        onChange({
          ...value,
          country: code,
          default_currency: cur as BaseCurrency,
        });
        return;
      }
    }
    onChange({ ...value, country: code });
  }

  function setCurrency(cur: string) {
    userTouchedCurrency.current = true;
    onChange({ ...value, default_currency: cur as BaseCurrency });
  }

  const canContinue = value.country.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">
          {tProfile("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{tProfile("sub")}</p>
      </header>

      <div className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="ob-fullname">{tProfile("fullNameLabel")}</Label>
          <Input
            id="ob-fullname"
            value={value.full_name}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={tProfile("fullNamePlaceholder")}
            className="h-11"
            autoComplete="name"
            autoFocus
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="ob-country">{tProfile("countryLabel")}</Label>
          <CountryCombobox
            id="ob-country"
            value={value.country || null}
            onChange={setCountry}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="ob-currency">{tProfile("currencyLabel")}</Label>
          <Select
            value={value.default_currency}
            onValueChange={(v) => {
              if (v) setCurrency(v);
            }}
          >
            <SelectTrigger id="ob-currency" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASE_CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {tProfile("currencyHint")}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="h-12 w-full text-base"
        >
          {t("continue")}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="self-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("skip")}
        </button>
      </div>
    </div>
  );
}
