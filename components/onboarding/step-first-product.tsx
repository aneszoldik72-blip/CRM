"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import { getCountry, type CurrencyCode } from "@/lib/data/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryCombobox } from "@/components/products/country-combobox";
import { CurrencySelect } from "@/components/products/currency-select";

export type ProductStepValue = {
  name: string;
  country: string;
  currency: CurrencyCode;
};

export type StepFirstProductProps = {
  value: ProductStepValue;
  onChange: (next: ProductStepValue) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export function StepFirstProduct({
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
}: StepFirstProductProps) {
  const t = useTranslations("onboarding");
  const tProduct = useTranslations("onboarding.product");

  // Currency inherits from country unless the user picks one manually —
  // same convention as ProductForm.
  const userTouchedCurrency = useRef(false);

  function setName(s: string) {
    onChange({ ...value, name: s });
  }

  function setCountry(code: string) {
    const country = getCountry(code);
    if (country && !userTouchedCurrency.current) {
      onChange({
        ...value,
        country: code,
        currency: country.defaultCurrency,
      });
      return;
    }
    onChange({ ...value, country: code });
  }

  function setCurrency(code: CurrencyCode) {
    userTouchedCurrency.current = true;
    onChange({ ...value, currency: code });
  }

  const canContinue = value.name.trim().length > 0 && value.country.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">
          {tProduct("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{tProduct("sub")}</p>
      </header>

      <div className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="ob-product-name">{tProduct("nameLabel")}</Label>
          <Input
            id="ob-product-name"
            value={value.name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tProduct("namePlaceholder")}
            className="h-11"
            autoComplete="off"
            autoFocus
            maxLength={80}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="ob-product-country">{tProduct("countryLabel")}</Label>
          <CountryCombobox
            id="ob-product-country"
            value={value.country || null}
            onChange={setCountry}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="ob-product-currency">
            {tProduct("currencyLabel")}
          </Label>
          <CurrencySelect
            id="ob-product-currency"
            value={value.currency}
            onChange={setCurrency}
          />
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
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {t("back")}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
