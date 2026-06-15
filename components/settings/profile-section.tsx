"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateProfileAction } from "@/app/[locale]/(app)/settings/actions";
import { Link } from "@/i18n/navigation";
import type { ProfileRow } from "@/lib/db/profile";
import {
  BASE_CURRENCIES,
  type BaseCurrency,
} from "@/lib/validators/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveIndicator } from "@/components/entries/save-indicator";
import { CountryCombobox } from "@/components/products/country-combobox";
import { AvatarUploader } from "./avatar-uploader";
import { InlineField } from "./inline-field";
import {
  SaveStateProvider,
  useSectionSaveState,
} from "./save-state-context";

function initialsOf(profile: ProfileRow): string {
  const src = profile.full_name?.trim() || profile.email || "U";
  const parts = src
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase());
  return parts.join("") || "U";
}

export function ProfileSection({ profile }: { profile: ProfileRow }) {
  return (
    <SaveStateProvider>
      <Inner profile={profile} />
    </SaveStateProvider>
  );
}

function Inner({ profile }: { profile: ProfileRow }) {
  const t = useTranslations("settings.profile");
  const { state } = useSectionSaveState();

  return (
    <section className="flex flex-col gap-7">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <SaveIndicator state={state} />
      </header>

      <AvatarUploader
        userId={profile.id}
        initialUrl={profile.image_url}
        fallbackInitials={initialsOf(profile)}
      />

      <div className="grid gap-5">
        <InlineField
          name="full_name"
          label={t("fullNameLabel")}
          initialValue={profile.full_name ?? ""}
          render={({ id, value, onChange }) => (
            <Input
              id={id}
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              autoComplete="name"
              maxLength={120}
              className="h-11"
            />
          )}
        />

        <InlineField
          name="country"
          label={t("countryLabel")}
          initialValue={profile.country ?? ""}
          render={({ id, value, onChange }) => (
            <CountryCombobox
              id={id}
              value={value || null}
              onChange={(code) => onChange(code)}
            />
          )}
        />

        <DefaultCurrencyField
          initial={profile.default_currency as BaseCurrency}
        />

        <div className="grid gap-1.5 rounded-lg border border-border bg-card/60 p-4">
          <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
            {t("emailRow")}
          </p>
          <p className="font-medium">{profile.email}</p>
          <Link
            href="/settings/security"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            → {t("changeEmailLink")}
          </Link>
        </div>
      </div>
    </section>
  );
}

// Dedicated field for default_currency: immediate save on change (no
// debounce — it's a single click), explicit toast, locally tracked so
// repeated A→B→A selections still hit the network.
function DefaultCurrencyField({ initial }: { initial: BaseCurrency }) {
  const t = useTranslations("settings.profile");
  const tCurrency = useTranslations("settings.preferences.currency");
  const ctx = useSectionSaveState();
  const [value, setValue] = useState<BaseCurrency>(initial);

  async function persist(next: BaseCurrency) {
    if (next === value) return;
    setValue(next);
    ctx.startSaving("default_currency");
    const res = await updateProfileAction({ default_currency: next });
    if (res.ok) {
      ctx.finishSaved("default_currency");
      toast.success(tCurrency("savedToast", { code: next }));
    } else {
      setValue(value);
      ctx.finishError();
      toast.error(res.serverError ?? tCurrency("saveFailedToast"));
    }
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="profile-default-currency">
        {t("defaultCurrencyLabel")}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v) void persist(v as BaseCurrency);
        }}
      >
        <SelectTrigger
          id="profile-default-currency"
          className="h-11 w-full"
        >
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
      <p className="text-xs text-muted-foreground">{t("defaultCurrencyHint")}</p>
    </div>
  );
}
