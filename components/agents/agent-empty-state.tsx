"use client";

import { useTranslations } from "next-intl";
import { PhoneCall, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

// Wedge copy: sell the value before the empty state. Operators who land here
// usually don't have agents in any tool — they're either confirming leads
// themselves or doing it over WhatsApp.
export function AgentEmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations("agents.empty");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <div className="relative mb-8 flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <PhoneCall className="size-10" aria-hidden />
        <span
          aria-hidden
          className="absolute -bottom-1 -end-1 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-[15px] font-semibold text-white shadow-sm ring-2 ring-background"
        >
          ✓
        </span>
      </div>

      <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("body")}
      </p>

      <ul className="mt-6 grid w-full max-w-md gap-2.5 text-start text-[13.5px] text-muted-foreground">
        <li className="flex items-start gap-2">
          <span aria-hidden className="mt-0.5 text-primary">▸</span>
          {t("bullet1")}
        </li>
        <li className="flex items-start gap-2">
          <span aria-hidden className="mt-0.5 text-primary">▸</span>
          {t("bullet2")}
        </li>
        <li className="flex items-start gap-2">
          <span aria-hidden className="mt-0.5 text-primary">▸</span>
          {t("bullet3")}
        </li>
      </ul>

      <Button
        type="button"
        onClick={onAdd}
        className="mt-8 h-11 gap-2 px-5"
      >
        <Plus className="size-4" />
        {t("cta")}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
