"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export type StepWelcomeProps = {
  onNext: () => void;
};

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const t = useTranslations("onboarding");
  const tWelcome = useTranslations("onboarding.welcome");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-start">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <h1 className="text-[28px] font-medium leading-tight tracking-tight">
          {tWelcome("title")}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {tWelcome("body")}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Button
          type="button"
          onClick={onNext}
          className="h-12 w-full text-base"
        >
          {tWelcome("cta")}
        </Button>
        <p className="sr-only">{t("stepOf", { n: 1, total: 5 })}</p>
      </div>
    </div>
  );
}
