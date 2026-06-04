"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { getCountry } from "@/lib/data/countries";
import {
  formatCurrency,
  formatMultiplier,
  formatPercent,
} from "@/lib/format";
import { Input } from "@/components/ui/input";

export type TableRow = {
  id: string;
  name: string;
  country: string | null;
  currency: string;
  hasEntry: boolean;
  revenueCents: number;
  spendCents: number;
  profitCents: number;
  margin: number | null;
  roas: number | null;
  deliveryRate: number | null;
};

// Aggregated totals row — always in the user's base currency.
export type TotalsRow = {
  currency: string;
  revenueCents: number;
  spendCents: number;
  profitCents: number;
  margin: number | null;
  roas: number | null;
  deliveryRate: number | null;
};

type SortKey =
  | "name"
  | "currency"
  | "revenueCents"
  | "spendCents"
  | "profitCents"
  | "margin"
  | "roas"
  | "deliveryRate";

type SortDir = "asc" | "desc";

type FilterMode = "all" | "with-data";

const COLUMNS: { key: SortKey; label: string; align?: "end" }[] = [
  { key: "name", label: "Produit" },
  { key: "currency", label: "Devise" },
  { key: "revenueCents", label: "CA", align: "end" },
  { key: "spendCents", label: "Dépenses", align: "end" },
  { key: "profitCents", label: "Bénéfice", align: "end" },
  { key: "margin", label: "Marge", align: "end" },
  { key: "roas", label: "ROAS", align: "end" },
  { key: "deliveryRate", label: "Livraison", align: "end" },
];

function compareValues(a: unknown, b: unknown): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // nulls always last
  if (b === null) return -1;
  if (typeof a === "string" && typeof b === "string")
    return a.localeCompare(b, "fr");
  if (typeof a === "number" && typeof b === "number") return a - b;
  return 0;
}

export function ProductsTable({
  rows,
  totals,
}: {
  rows: TableRow[];
  totals?: TotalsRow;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "profitCents",
    dir: "desc",
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  const view = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (filter === "with-data") list = list.filter((r) => r.hasEntry);
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    list = [...list].sort((a, b) => {
      const cmp = compareValues(a[sort.key], b[sort.key]);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, query, sort, filter]);

  function onSort(key: SortKey) {
    setSort((cur) =>
      cur.key === key
        ? { key, dir: cur.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );
  }

  return (
    <section
      aria-label="Détail par produit"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold tracking-tight">
          Détail par produit
        </h2>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            className="inline-flex rounded-lg border border-border bg-card p-1 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-md px-2.5 py-1",
                filter === "all"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Tous
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "with-data"}
              onClick={() => setFilter("with-data")}
              className={cn(
                "rounded-md px-2.5 py-1",
                filter === "with-data"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Avec données
            </button>
          </div>
          <div className="relative w-full sm:w-56">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Chercher un produit…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 ps-8"
              aria-label="Chercher un produit"
            />
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2 font-medium",
                    c.align === "end" ? "text-end" : "text-start",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {c.label}
                    <ArrowUpDown
                      className={cn(
                        "size-3",
                        sort.key === c.key
                          ? "text-foreground"
                          : "text-muted-foreground/50",
                      )}
                    />
                  </button>
                </th>
              ))}
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {view.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-3 py-6 text-center text-xs text-muted-foreground"
                >
                  Aucun produit ne correspond.
                </td>
              </tr>
            ) : (
              view.map((r) => <TableRowItem key={r.id} row={r} />)
            )}
          </tbody>
          {totals && view.length > 0 && (
            <tfoot className="border-t border-border bg-muted/40 text-sm font-medium">
              <tr>
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {totals.currency}
                </td>
                <td className="px-3 py-2 text-end tabular-nums">
                  {formatCurrency(totals.revenueCents, totals.currency)}
                </td>
                <td className="px-3 py-2 text-end tabular-nums">
                  {formatCurrency(totals.spendCents, totals.currency)}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-end tabular-nums",
                    totals.profitCents > 0 && "text-emerald-500",
                    totals.profitCents < 0 && "text-destructive",
                  )}
                >
                  {totals.profitCents > 0
                    ? "▲ "
                    : totals.profitCents < 0
                      ? "▼ "
                      : ""}
                  {formatCurrency(
                    Math.abs(totals.profitCents),
                    totals.currency,
                  )}
                </td>
                <td className="px-3 py-2 text-end tabular-nums">
                  {totals.margin === null ? "—" : formatPercent(totals.margin)}
                </td>
                <td className="px-3 py-2 text-end tabular-nums">
                  {totals.roas === null
                    ? "—"
                    : formatMultiplier(totals.roas)}
                </td>
                <td className="px-3 py-2 text-end tabular-nums">
                  {totals.deliveryRate === null
                    ? "—"
                    : formatPercent(totals.deliveryRate)}
                </td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {view.length === 0 ? (
          <li className="rounded-xl border border-border bg-card p-4 text-center text-xs text-muted-foreground">
            Aucun produit ne correspond.
          </li>
        ) : (
          <>
            {view.map((r) => (
              <MobileCard key={r.id} row={r} />
            ))}
            {totals && <MobileTotalsCard totals={totals} />}
          </>
        )}
      </ul>
    </section>
  );
}

function MobileTotalsCard({ totals }: { totals: TotalsRow }) {
  const positive = totals.profitCents >= 0;
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">Total</p>
        <span className="text-xs text-muted-foreground">{totals.currency}</span>
      </div>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          positive ? "text-emerald-500" : "text-destructive",
        )}
      >
        {positive ? "▲ " : "▼ "}
        {formatCurrency(Math.abs(totals.profitCents), totals.currency)}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Marge{" "}
          <span className="text-foreground tabular-nums">
            {totals.margin === null ? "—" : formatPercent(totals.margin)}
          </span>
        </span>
        <span>
          ROAS{" "}
          <span className="text-foreground tabular-nums">
            {totals.roas === null ? "—" : formatMultiplier(totals.roas)}
          </span>
        </span>
        <span>
          Livraison{" "}
          <span className="text-foreground tabular-nums">
            {totals.deliveryRate === null
              ? "—"
              : formatPercent(totals.deliveryRate)}
          </span>
        </span>
      </div>
    </li>
  );
}

function TableRowItem({ row }: { row: TableRow }) {
  const country = getCountry(row.country);
  const profitPositive = row.profitCents >= 0;
  return (
    <tr
      className={cn(
        "border-t border-border transition-colors hover:bg-muted/40",
        !row.hasEntry && "opacity-70",
      )}
    >
      <td className="px-3 py-2">
        <Link
          href={`/products/${row.id}`}
          className="inline-flex items-center gap-2 hover:underline"
        >
          {country && (
            <span aria-hidden className="text-base leading-none">
              {country.flag}
            </span>
          )}
          <span className="truncate">{row.name}</span>
        </Link>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {row.currency}
      </td>
      <td className="px-3 py-2 text-end tabular-nums">
        {row.hasEntry ? formatCurrency(row.revenueCents, row.currency) : "—"}
      </td>
      <td className="px-3 py-2 text-end tabular-nums">
        {row.hasEntry ? formatCurrency(row.spendCents, row.currency) : "—"}
      </td>
      <td
        className={cn(
          "px-3 py-2 text-end tabular-nums",
          row.hasEntry && profitPositive && "text-emerald-500",
          row.hasEntry && !profitPositive && "text-destructive",
        )}
      >
        {row.hasEntry ? (
          <>
            {profitPositive ? "▲ " : "▼ "}
            {formatCurrency(Math.abs(row.profitCents), row.currency)}
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2 text-end tabular-nums">
        {row.margin === null ? "—" : formatPercent(row.margin)}
      </td>
      <td className="px-3 py-2 text-end tabular-nums">
        {row.roas === null ? "—" : formatMultiplier(row.roas)}
      </td>
      <td className="px-3 py-2 text-end tabular-nums">
        {row.deliveryRate === null ? "—" : formatPercent(row.deliveryRate)}
      </td>
      <td className="px-3 py-2 text-end">
        <Link
          href={`/products/${row.id}`}
          aria-label={`Ouvrir ${row.name}`}
          className="inline-flex text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </Link>
      </td>
    </tr>
  );
}

function MobileCard({ row }: { row: TableRow }) {
  const country = getCountry(row.country);
  const profitPositive = row.profitCents >= 0;
  return (
    <li
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border border-border bg-card p-4",
        !row.hasEntry && "opacity-70",
      )}
    >
      <Link
        href={`/products/${row.id}`}
        className="absolute inset-0 z-10 rounded-xl"
        aria-label={`Ouvrir ${row.name}`}
      />
      <div className="relative z-0 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 truncate">
          {country && (
            <span aria-hidden className="text-base leading-none">
              {country.flag}
            </span>
          )}
          <span className="truncate font-medium">{row.name}</span>
        </p>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </div>
      {row.hasEntry ? (
        <>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums",
              profitPositive ? "text-emerald-500" : "text-destructive",
            )}
          >
            {profitPositive ? "▲ " : "▼ "}
            {formatCurrency(Math.abs(row.profitCents), row.currency)}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Marge{" "}
              <span className="text-foreground tabular-nums">
                {row.margin === null ? "—" : formatPercent(row.margin)}
              </span>
            </span>
            <span>
              ROAS{" "}
              <span className="text-foreground tabular-nums">
                {row.roas === null ? "—" : formatMultiplier(row.roas)}
              </span>
            </span>
            <span>
              Livraison{" "}
              <span className="text-foreground tabular-nums">
                {row.deliveryRate === null
                  ? "—"
                  : formatPercent(row.deliveryRate)}
              </span>
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Pas de données pour ce mois
        </p>
      )}
    </li>
  );
}
