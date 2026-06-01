"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProductStatus = "active" | "archived" | "all";

const TABS: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Actifs" },
  { value: "archived", label: "Archivés" },
  { value: "all", label: "Tous" },
];

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
        aria-label="Filtrer par statut"
        className="inline-flex rounded-lg border border-border bg-card p-1 text-sm"
      >
        {TABS.map((t) => {
          const active = t.value === status;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pushParams({ status: t.value })}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span className="ms-1.5 text-xs opacity-70">
                ({counts[t.value]})
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
            placeholder="Chercher un produit…"
            className="h-10 ps-9 pe-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            aria-label="Rechercher un produit"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Effacer la recherche"
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
          Ajouter
        </Button>
      </div>
    </div>
  );
}
