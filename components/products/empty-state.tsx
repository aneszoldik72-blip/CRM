"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProductsEmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations("products");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-8 flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Plus className="size-10" aria-hidden />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">
        {t("empty.title")}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("empty.body")}
      </p>
      <Button
        type="button"
        onClick={onAdd}
        className="mt-7 h-11 gap-2 px-5"
      >
        <Plus className="size-4" />
        {t("addProduct")}
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("empty.importHint")}{" "}
        <span className="text-muted-foreground/60">{t("empty.soon")}</span>
      </p>
    </div>
  );
}
