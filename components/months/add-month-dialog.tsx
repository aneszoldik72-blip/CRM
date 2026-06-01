"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import {
  currentYyyymm,
  formatMonthLabel,
  formatMonthRange,
  nextYyyymm,
  yyyymmFromDate,
} from "@/lib/date";
import type { MonthRow } from "@/lib/db/months";
import { createMonthAction } from "@/app/(app)/products/[id]/actions";
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
  const latest = existingMonths[0] ?? null;
  const usedYyyymm = useMemo(
    () => new Set(existingMonths.map((m) => yyyymmFromDate(m.start_date))),
    [existingMonths],
  );

  const defaultMonth = useMemo(() => {
    if (latest) {
      const candidate = nextYyyymm(yyyymmFromDate(latest.start_date));
      // Skip forward until we find a slot that isn't already taken.
      let cursor = candidate;
      for (let i = 0; i < 24 && usedYyyymm.has(cursor); i++) {
        cursor = nextYyyymm(cursor);
      }
      return cursor;
    }
    return currentYyyymm();
  }, [latest, usedYyyymm]);

  const [month, setMonth] = useState(defaultMonth);
  const [label, setLabel] = useState(formatMonthLabel(defaultMonth));
  const [copyFromPrevious, setCopyFromPrevious] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const userTouchedLabel = useRef(false);

  // Reset form whenever the dialog is opened so the defaults reflect the
  // latest month list (e.g., after a previous create).
  useEffect(() => {
    if (open) {
      setMonth(defaultMonth);
      setLabel(formatMonthLabel(defaultMonth));
      setCopyFromPrevious(false);
      setServerError(null);
      setFieldErrors({});
      userTouchedLabel.current = false;
    }
  }, [open, defaultMonth]);

  function onMonthChange(value: string) {
    setMonth(value);
    if (!userTouchedLabel.current && /^\d{4}-\d{2}$/.test(value)) {
      setLabel(formatMonthLabel(value));
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
      setFieldErrors({ month: "Ce mois existe déjà pour ce produit." });
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

  const range = formatMonthRange(month);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau mois</DialogTitle>
          <DialogDescription>
            Ajoute un mois de suivi à ce produit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="month-input">Mois *</Label>
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
            <Label htmlFor="label-input">Étiquette *</Label>
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
                  Repartir des chiffres de {latest.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  Recopie tes coûts du mois précédent. Tes ventes repartent
                  de zéro.
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
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={pending || alreadyExists}
              className="h-10 px-4"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Ajout en cours…
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
