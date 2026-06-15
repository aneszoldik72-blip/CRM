"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { updateProfileAction } from "@/app/[locale]/(app)/settings/actions";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import type { ProfileRow } from "@/lib/db/profile";
import {
  BASE_CURRENCIES,
  type BaseCurrency,
} from "@/lib/validators/profile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SaveIndicator } from "@/components/entries/save-indicator";
import {
  SaveStateProvider,
  useSectionSaveState,
} from "./save-state-context";

const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

const THEME_OPTIONS = [
  { value: "system", labelKey: "auto" },
  { value: "light", labelKey: "light" },
  { value: "dark", labelKey: "dark" },
] as const;

export function PreferencesSection({ profile }: { profile: ProfileRow }) {
  return (
    <SaveStateProvider>
      <Inner profile={profile} />
    </SaveStateProvider>
  );
}

function Inner({ profile }: { profile: ProfileRow }) {
  const t = useTranslations("settings.preferences");
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

      <ThemeRow />
      <LanguageRow />
      <CurrencyRow current={profile.default_currency as BaseCurrency} />

      <div className="mt-2 flex items-center gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("notificationsHeader")}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <NotificationRow
        name="notification_payment_failed"
        initialValue={profile.notification_payment_failed}
        labelKey="paymentFailed"
        comingSoon
      />
      <NotificationRow
        name="notification_trial_ending"
        initialValue={profile.notification_trial_ending}
        labelKey="trialEnding"
        comingSoon
      />
      <NotificationRow
        name="notification_weekly_summary"
        initialValue={profile.notification_weekly_summary}
        labelKey="weeklySummary"
      />
    </section>
  );
}

function ThemeRow() {
  const t = useTranslations("settings.preferences.theme");
  const { theme, setTheme } = useTheme();
  const current = theme ?? "system";

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium">{t("label")}</p>
      <p className="text-xs text-muted-foreground">{t("sub")}</p>
      <div className="mt-2 inline-flex rounded-lg border border-border bg-background/40 p-1 text-xs">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={current === opt.value}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              current === opt.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

function LanguageRow() {
  const t = useTranslations("settings.preferences.language");
  const ctx = useSectionSaveState();
  const router = useRouter();
  const pathname = usePathname();
  const liveLocale = useLocale() as AppLocale;
  const [, startTransition] = useTransition();

  function switchTo(next: AppLocale) {
    if (next === liveLocale) return;
    ctx.startSaving("locale");
    startTransition(async () => {
      const res = await updateProfileAction({ locale: next });
      if (res.ok) {
        ctx.finishSaved("locale");
        // Update URL prefix; the layout re-renders with the new locale and
        // next-intl loads the new messages.
        router.replace(pathname, { locale: next });
      } else {
        ctx.finishError();
        toast.error(res.serverError ?? "Failed");
      }
    });
  }

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium">{t("label")}</p>
      <p className="text-xs text-muted-foreground">{t("sub")}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {routing.locales.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            aria-pressed={liveLocale === code}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              liveLocale === code
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {LOCALE_LABELS[code]}
          </button>
        ))}
      </div>
    </div>
  );
}

function CurrencyRow({ current }: { current: BaseCurrency }) {
  const t = useTranslations("settings.preferences.currency");
  const ctx = useSectionSaveState();
  const [value, setValue] = useState<BaseCurrency>(current);

  async function persist(next: BaseCurrency) {
    if (next === value) return;
    setValue(next);
    ctx.startSaving("default_currency");
    const res = await updateProfileAction({ default_currency: next });
    if (res.ok) {
      ctx.finishSaved("default_currency");
      toast.success(t("savedToast", { code: next }));
    } else {
      // Revert local state so the Select reflects the actual DB value.
      setValue(value);
      ctx.finishError();
      toast.error(res.serverError ?? t("saveFailedToast"));
    }
  }

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium">{t("label")}</p>
      <p className="text-xs text-muted-foreground">{t("sub")}</p>
      <div className="mt-2 max-w-xs">
        <Select
          value={value}
          onValueChange={(v) => {
            if (v) void persist(v as BaseCurrency);
          }}
        >
          <SelectTrigger className="h-11 w-full">
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
      </div>
    </div>
  );
}

function NotificationRow({
  name,
  initialValue,
  labelKey,
  comingSoon,
}: {
  name:
    | "notification_payment_failed"
    | "notification_trial_ending"
    | "notification_weekly_summary";
  initialValue: boolean;
  labelKey: "paymentFailed" | "trialEnding" | "weeklySummary";
  comingSoon?: boolean;
}) {
  const t = useTranslations("settings.preferences");
  const ctx = useSectionSaveState();

  async function onCheckedChange(checked: boolean) {
    ctx.startSaving(name);
    const res = await updateProfileAction({ [name]: checked });
    if (res.ok) ctx.finishSaved(name);
    else ctx.finishError();
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          {t(`${labelKey}.label`)}
          {comingSoon && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("comingSoon")}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{t(`${labelKey}.sub`)}</p>
      </div>
      <Switch
        defaultChecked={initialValue}
        onCheckedChange={(v: boolean) => void onCheckedChange(v)}
      />
    </div>
  );
}
