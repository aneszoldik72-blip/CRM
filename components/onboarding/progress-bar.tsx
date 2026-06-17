"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type ProgressBarProps = {
  /** 1-based current step index. */
  step: number;
  total: number;
};

export function ProgressBar({ step, total }: ProgressBarProps) {
  const t = useTranslations("onboarding");
  return (
    <div className="flex flex-col gap-2">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        className="flex items-center gap-1.5"
      >
        {Array.from({ length: total }).map((_, i) => {
          const idx = i + 1;
          const completed = idx < step;
          const current = idx === step;
          return (
            <span
              key={idx}
              aria-hidden
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                completed && "bg-primary",
                current && "bg-primary/70 animate-pulse",
                !completed && !current && "bg-muted",
              )}
            />
          );
        })}
      </div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {t("stepOf", { n: step, total })}
      </p>
    </div>
  );
}
