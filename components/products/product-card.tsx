"use client";

import { useTranslations } from "next-intl";
import { Archive, ArchiveRestore, MoreVertical, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { getCountry } from "@/lib/data/countries";
import type { ProductRow } from "@/lib/db/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ProductCardProps = {
  product: ProductRow;
  pending?: boolean;
  onEdit: (product: ProductRow) => void;
  onArchiveToggle: (product: ProductRow) => void;
};

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]!.toUpperCase())
      .join("") || "?"
  );
}

function useRelativeDate(): (iso: string) => string {
  const t = useTranslations("products.relative");
  return (iso: string) => {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
    if (days < 1) return t("today");
    if (days === 1) return t("yesterday");
    if (days < 30) return t("daysAgo", { days });
    const months = Math.floor(days / 30);
    if (months < 12) return t("monthsAgo", { months });
    const years = Math.floor(months / 12);
    return t("yearsAgo", { years });
  };
}

export function ProductCard({
  product,
  pending,
  onEdit,
  onArchiveToggle,
}: ProductCardProps) {
  const t = useTranslations("products.card");
  const formatRelativeDate = useRelativeDate();
  const country = getCountry(product.country);
  const archived = product.archived;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30",
        archived && "opacity-70",
        pending && "pointer-events-none opacity-60",
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl font-semibold text-muted-foreground">
            {initialsFromName(product.name)}
          </div>
        )}
        <div className="absolute end-2 top-2 z-30">
          <Badge
            variant="outline"
            className={cn(
              "border-transparent bg-background/80 backdrop-blur",
              archived ? "text-muted-foreground" : "text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "me-1 inline-block size-1.5 rounded-full",
                archived ? "bg-muted-foreground" : "bg-emerald-500",
              )}
            />
            {archived ? t("statusArchived") : t("statusActive")}
          </Badge>
        </div>
      </div>

      <div className="relative flex flex-col gap-1 p-4">
        <h3 className="truncate pe-9 text-base font-medium">{product.name}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {country ? (
            <>
              <span aria-hidden>{country.flag}</span> {country.code} ·{" "}
              {product.currency} · {formatRelativeDate(product.created_at)}
            </>
          ) : (
            <>
              {product.currency} · {formatRelativeDate(product.created_at)}
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t("noData")}</p>

        <div className="absolute end-2 top-2 z-30">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("moreActions")}
                />
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(product);
                }}
              >
                <Pencil /> {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  onArchiveToggle(product);
                }}
              >
                {archived ? (
                  <>
                    <ArchiveRestore /> {t("unarchive")}
                  </>
                ) : (
                  <>
                    <Archive /> {t("archive")}
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Link
        href={`/products/${product.id}`}
        aria-label={t("openAria", { name: product.name })}
        className="absolute inset-0 z-20 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
    </article>
  );
}
