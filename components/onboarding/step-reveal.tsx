"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { bcp47, type AppLocale } from "@/i18n/routing";
import { formatCurrency } from "@/lib/format";
import { computeMetrics } from "@/lib/metrics";
import { Button } from "@/components/ui/button";
import type { EntryStepValue } from "./step-first-entry";

export type StepRevealProps = {
  entry: EntryStepValue;
  currency: string;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
};

// CSS-only count-up over ~1.2s, eased.
const ANIMATION_MS = 1200;

export function StepReveal({
  entry,
  currency,
  submitting,
  onSubmit,
  onBack,
}: StepRevealProps) {
  const t = useTranslations("onboarding");
  const tEntry = useTranslations("onboarding.entry");
  const tReveal = useTranslations("onboarding.reveal");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);

  const metrics = useMemo(
    () =>
      computeMetrics({
        ...entry,
        initial_stock: null,
        current_stock: null,
        daysElapsed: null,
      }),
    [entry],
  );

  const targetCents = metrics.netProfit.value ?? 0;
  const positive = targetCents >= 0;

  // requestAnimationFrame-driven count-up.
  const [displayCents, setDisplayCents] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / ANIMATION_MS);
      // Ease-out cubic for a deliberate landing.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayCents(Math.round(targetCents * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [targetCents]);

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-medium tracking-tight">
          {positive ? tReveal("titlePositive") : tReveal("titleNegative")}
        </h1>
        <p className="text-sm text-muted-foreground">{tReveal("body")}</p>
      </header>

      <div className="flex flex-col items-center gap-2 py-6">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {tEntry("kpiNetProfit")}
        </p>
        <p
          className={cn(
            "text-5xl font-semibold tabular-nums leading-none transition-colors duration-200",
            positive ? "text-emerald-500" : "text-destructive",
          )}
        >
          {positive ? "▲ " : "▼ "}
          {formatCurrency(Math.abs(displayCents), currency, bcp)}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="h-12 w-full text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            tReveal("cta")
          )}
        </Button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="self-center text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          ← {t("back")}
        </button>
      </div>
    </div>
  );
}
