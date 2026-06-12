"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { bcp47, type AppLocale } from "@/i18n/routing";
import {
  currentYyyymm,
  formatMonthLabel,
  formatMonthRange,
  nextYyyymm,
  yyyymmFromDate,
} from "@/lib/date";
import type { MonthRow } from "@/lib/db/months";
import { createMonthAction } from "@/app/[locale]/(app)/products/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineErrorBanner } from "@/components/auth/inline-error-banner";

export type AddMonthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  existingMonths: MonthRow[];
  onCreated: (month: MonthRow) => void;
};

export function AddMonthDialog({
  open,
  onOpenChange,
  productId,
  existingMonths,
  onCreated,
}: AddMonthDialogProps) {
  const t = useTranslations("months");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);

  const latest = existingMonths[0] ?? null;
  const usedYyyymm = useMemo(
    () => new Set(existingMonths.map((m) => yyyymmFromDate(m.start_date))),
    [existingMonths],
  );

  const defaultMonth = useMemo(() => {
    if (latest) {
      const candidate = nextYyyymm(yyyymmFromDate(latest.start_date));
      let cursor = candidate;
      for (let i = 0; i < 24 && usedYyyymm.has(cursor); i++) {
        cursor = nextYyyymm(cursor);
      }
      return cursor;
    }
    return currentYyyymm();
  }, [latest, usedYyyymm]);

  const [month, setMonth] = useState(defaultMonth);
  const [label, setLabel] = useState(formatMonthLabel(defaultMonth, bcp));
  const [copyFromPrevious, setCopyFromPrevious] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const userTouchedLabel = useRef(false);

  useEffect(() => {
    if (open) {
      setMonth(defaultMonth);
      setLabel(formatMonthLabel(defaultMonth, bcp));
      setCopyFromPrevious(false);
      setServerError(null);
      setFieldErrors({});
      userTouchedLabel.current = false;
    }
  }, [open, defaultMonth, bcp]);

  function onMonthChange(value: string) {
    setMonth(value);
    if (!userTouchedLabel.current && /^\d{4}-\d{2}$/.test(value)) {
      setLabel(formatMonthLabel(value, bcp));
    }
  }

  function onLabelChange(value: string) {
    userTouchedLabel.current = true;
    setLabel(value);
  }

  const alreadyExists = usedYyyymm.has(month);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    if (alreadyExists) {
      setFieldErrors({ month: t("alreadyExists") });
      return;
    }

    startTransition(async () => {
      const res = await createMonthAction(productId, {
        month,
        label: label.trim(),
        copyFromMonthId: copyFromPrevious && latest ? latest.id : null,
      });
      if (res.ok && res.month) {
        onCreated(res.month);
        onOpenChange(false);
        return;
      }
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      if (res.serverError) setServerError(res.serverError);
    });
  }

  const range = formatMonthRange(month, bcp);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newMonth")}</DialogTitle>
          <DialogDescription>{t("newMonthDesc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="month-input">{t("monthLabel")}</Label>
            <Input
              id="month-input"
              type="month"
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              aria-invalid={!!fieldErrors.month || alreadyExists || undefined}
              className="h-11"
              required
            />
            {range && (
              <p className="text-[12.5px] text-muted-foreground">{range}</p>
            )}
            {fieldErrors.month && (
              <p className="text-[12.5px] text-destructive">
                {fieldErrors.month}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="label-input">{t("labelLabel")}</Label>
            <Input
              id="label-input"
              type="text"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              maxLength={40}
              aria-invalid={!!fieldErrors.label || undefined}
              className="h-11"
              required
            />
            {fieldErrors.label && (
              <p className="text-[12.5px] text-destructive">
                {fieldErrors.label}
              </p>
            )}
          </div>

          {latest && (
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <input
                type="checkbox"
                checked={copyFromPrevious}
                onChange={(e) => setCopyFromPrevious(e.target.checked)}
                className="mt-0.5 size-4 rounded border-input accent-primary"
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {t("copyFromTitle", { label: latest.label })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("copyFromDesc")}
                </span>
              </span>
            </label>
          )}

          {serverError && <InlineErrorBanner message={serverError} />}

          <div className="-mx-4 -mb-4 mt-2 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="h-10 px-4"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={pending || alreadyExists}
              className="h-10 px-4"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
