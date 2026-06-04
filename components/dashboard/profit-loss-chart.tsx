"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { getCountry } from "@/lib/data/countries";
import { formatCurrency } from "@/lib/format";

export type ProfitRow = {
  id: string;
  name: string;
  country: string | null;
  profitCents: number;
};

const MAX_VISIBLE = 8;

export function ProfitLossChart({
  products,
  currency,
}: {
  products: ProfitRow[];
  currency: string;
}) {
  if (products.length === 0) {
    return (
      <section
        aria-label="Bénéfice par produit"
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="text-base font-semibold tracking-tight">
          Bénéfice par produit
        </h2>
        <p className="text-xs text-muted-foreground">
          Aucun produit avec des données pour ce mois.
        </p>
      </section>
    );
  }

  const visible = products.slice(0, MAX_VISIBLE);
  const hidden = products.length - visible.length;
  const maxAbs = Math.max(
    1,
    ...products.map((p) => Math.abs(p.profitCents)),
  );

  return (
    <section
      aria-label="Bénéfice par produit"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <h2 className="text-base font-semibold tracking-tight">
        Bénéfice par produit
      </h2>

      <ul className="flex flex-col gap-3">
        {visible.map((p) => {
          const widthPct = Math.max(
            (Math.abs(p.profitCents) / maxAbs) * 50,
            p.profitCents === 0 ? 0 : 2,
          );
          const positive = p.profitCents >= 0;
          const country = getCountry(p.country);
          return (
            <li
              key={p.id}
              className="grid grid-cols-[minmax(0,9rem)_1fr_minmax(0,7rem)] items-center gap-3 text-sm"
            >
              <Link
                href={`/products/${p.id}`}
                className="truncate hover:underline"
                title={p.name}
              >
                {country && (
                  <span aria-hidden className="me-1">
                    {country.flag}
                  </span>
                )}
                {p.name}
              </Link>

              {/* Diverging bar: anchored to a center axis. */}
              <div className="relative flex h-3 items-center">
                <div className="absolute inset-y-0 start-1/2 w-px bg-border" />
                {positive ? (
                  <div
                    className="absolute start-1/2 h-full rounded-e-sm bg-emerald-500/70"
                    style={{ width: `${widthPct}%` }}
                  />
                ) : (
                  <div
                    className="absolute h-full rounded-s-sm bg-destructive/70"
                    style={{
                      width: `${widthPct}%`,
                      insetInlineEnd: "50%",
                    }}
                  />
                )}
              </div>

              <span
                className={cn(
                  "text-end tabular-nums",
                  positive ? "text-emerald-500" : "text-destructive",
                )}
              >
                {positive ? "▲ " : "▼ "}
                {formatCurrency(Math.abs(p.profitCents), currency)}
              </span>
            </li>
          );
        })}
      </ul>

      {hidden > 0 && (
        <p className="text-xs text-muted-foreground">
          + {hidden} autre{hidden > 1 ? "s" : ""} — voir le tableau
        </p>
      )}
    </section>
  );
}
