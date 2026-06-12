"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProductStatus = "active" | "archived" | "all";

const TAB_VALUES: ProductStatus[] = ["active", "archived", "all"];
const TAB_LABEL_KEYS: Record<ProductStatus, string> = {
  active: "active",
  archived: "archived",
  all: "all",
};

export function ProductsToolbar({
  status,
  query,
  counts,
  onAdd,
}: {
  status: ProductStatus;
  query: string;
  counts: Record<ProductStatus, number>;
  onAdd: () => void;
}) {
  const t = useTranslations("products");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  function pushParams(next: { status?: ProductStatus; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.status !== undefined) {
      if (next.status === "active") params.delete("status");
      else params.set("status", next.status);
    }
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSearchChange(value: string) {
    setLocalQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ q: value }), 200);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div
        role="tablist"
        aria-label={t("filterByStatus")}
        className="inline-flex rounded-lg border border-border bg-card p-1 text-sm"
      >
        {TAB_VALUES.map((value) => {
          const active = value === status;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pushParams({ status: value })}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(TAB_LABEL_KEYS[value])}
              <span className="ms-1.5 text-xs opacity-70">
                ({counts[value]})
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={localQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 ps-9 pe-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            aria-label={t("searchAria")}
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label={t("clearSearch")}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          type="button"
          onClick={onAdd}
          className="hidden h-10 gap-2 px-4 sm:inline-flex"
        >
          <Plus className="size-4" />
          {t("addProductShort")}
        </Button>
      </div>
    </div>
  );
}
