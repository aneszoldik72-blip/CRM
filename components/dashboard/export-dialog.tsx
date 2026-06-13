"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProductRow } from "@/lib/db/products";
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

type Range = "month" | "lastMonth" | "last3" | "all" | "custom";
type Include = "kpis" | "full";
type Scope = "all" | "specific";

export type ExportDialogProps = {
  products: ProductRow[];
  baseCurrency: string;
};

export function ExportDialog({ products, baseCurrency }: ExportDialogProps) {
  const t = useTranslations("export");
  const tCommon = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [include, setInclude] = useState<Include>("full");

  const customMissing =
    range === "custom" && (!isYyyymm(from) || !isYyyymm(to));
  const noProductsPicked =
    scope === "specific" && selectedIds.size === 0;

  const disabled = customMissing || noProductsPicked;

  const downloadUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("range", range);
    if (range === "custom") {
      if (isYyyymm(from)) params.set("from", from);
      if (isYyyymm(to)) params.set("to", to);
    }
    if (scope === "specific" && selectedIds.size > 0) {
      params.set("products", Array.from(selectedIds).join(","));
    }
    params.set("include", include);
    params.set("currency", baseCurrency);
    return `/api/export/csv?${params.toString()}`;
  }, [range, from, to, scope, selectedIds, include, baseCurrency]);

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onDownload() {
    if (disabled) return;
    // Trigger native browser download — no fetch + blob plumbing needed.
    // Same-origin GET, cookies attached, route returns the file with
    // Content-Disposition: attachment.
    window.location.href = downloadUrl;
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Download className="size-4" aria-hidden />
        <span>{t("trigger")}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDesc")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            {/* Period */}
            <section className="grid gap-2">
              <Label>{t("period.label")}</Label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={range === "month"}
                  onClick={() => setRange("month")}
                  label={t("period.thisMonth")}
                />
                <Chip
                  active={range === "lastMonth"}
                  onClick={() => setRange("lastMonth")}
                  label={t("period.lastMonth")}
                />
                <Chip
                  active={range === "last3"}
                  onClick={() => setRange("last3")}
                  label={t("period.last3")}
                />
                <Chip
                  active={range === "all"}
                  onClick={() => setRange("all")}
                  label={t("period.all")}
                />
                <Chip
                  active={range === "custom"}
                  onClick={() => setRange("custom")}
                  label={t("period.custom")}
                />
              </div>

              {range === "custom" && (
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label
                      htmlFor="export-from"
                      className="text-[12px] text-muted-foreground"
                    >
                      {t("period.fromLabel")}
                    </Label>
                    <Input
                      id="export-from"
                      type="month"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="h-10 tabular-nums"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label
                      htmlFor="export-to"
                      className="text-[12px] text-muted-foreground"
                    >
                      {t("period.toLabel")}
                    </Label>
                    <Input
                      id="export-to"
                      type="month"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="h-10 tabular-nums"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Scope */}
            <section className="grid gap-2">
              <Label>{t("scope.label")}</Label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={scope === "all"}
                  onClick={() => setScope("all")}
                  label={t("scope.all")}
                />
                <Chip
                  active={scope === "specific"}
                  onClick={() => setScope("specific")}
                  label={t("scope.specific")}
                />
              </div>

              {scope === "specific" && (
                <ul className="mt-1 grid max-h-44 gap-1 overflow-y-auto rounded-lg border border-border bg-card/60 p-1">
                  {products.length === 0 ? (
                    <li className="px-3 py-2 text-xs text-muted-foreground">
                      {t("scope.noProducts")}
                    </li>
                  ) : (
                    products.map((p) => {
                      const checked = selectedIds.has(p.id);
                      return (
                        <li key={p.id}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                              checked ? "bg-primary/10 text-primary" : "hover:bg-muted",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProduct(p.id)}
                              className="size-4 rounded border-input accent-primary"
                            />
                            <span className="truncate">{p.name}</span>
                            <span className="ms-auto text-xs text-muted-foreground">
                              {p.currency}
                            </span>
                          </label>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </section>

            {/* Include */}
            <section className="grid gap-2">
              <Label>{t("include.label")}</Label>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={include === "kpis"}
                  onClick={() => setInclude("kpis")}
                  label={t("include.kpis")}
                />
                <Chip
                  active={include === "full"}
                  onClick={() => setInclude("full")}
                  label={t("include.full")}
                />
              </div>
            </section>

            <p className="text-xs text-muted-foreground">
              {t("currencyLine", { code: baseCurrency })}
            </p>
          </div>

          <div className="-mx-4 -mb-4 mt-2 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 px-4"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={onDownload}
              disabled={disabled}
              className="h-10 gap-1.5 px-4"
            >
              <Download className="size-4" />
              {t("download")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function isYyyymm(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}
