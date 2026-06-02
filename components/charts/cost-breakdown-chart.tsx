"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useWatch, type Control } from "react-hook-form";

import { formatCurrency, formatPercent } from "@/lib/format";
import type { EntryValues } from "@/lib/validators/entry";

type Slice = {
  key: string;
  name: string;
  cents: number;
  color: string;
};

const CATEGORIES: { key: keyof EntryValues; name: string; color: string }[] = [
  { key: "ads_spend_cents", name: "Pub", color: "var(--chart-1)" },
  { key: "test_spend_cents", name: "Tests", color: "var(--chart-2)" },
  { key: "ad_account_cents", name: "Comptes pub", color: "var(--chart-3)" },
  { key: "product_cost_cents", name: "Coût produit", color: "var(--chart-4)" },
  { key: "service_cost_cents", name: "Livraison", color: "var(--chart-5)" },
  { key: "bonus_cents", name: "Bonus agents", color: "var(--chart-6)" },
];

const SMALL_SLICE_THRESHOLD = 0.05;

type TooltipProps = {
  active?: boolean;
  payload?: { payload: { name: string; cents: number; share: number } }[];
};

export default function CostBreakdownChart({
  control,
  currency,
}: {
  control: Control<EntryValues>;
  currency: string;
}) {
  const values = useWatch({ control }) as EntryValues;

  const slices: Slice[] = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        key: c.key,
        name: c.name,
        cents: (values[c.key] as number | null) ?? 0,
        color: c.color,
      })),
    [values],
  );

  const total = slices.reduce((sum, s) => sum + s.cents, 0);

  // Collapse small slices into "Autres" for the donut only; legend keeps full
  // breakdown.
  const donutData = useMemo(() => {
    if (total === 0) return [];
    const big: { name: string; cents: number; share: number; color: string }[] = [];
    const small: Slice[] = [];
    for (const s of slices) {
      if (s.cents === 0) continue;
      const share = s.cents / total;
      if (share < SMALL_SLICE_THRESHOLD) small.push(s);
      else big.push({ name: s.name, cents: s.cents, share, color: s.color });
    }
    if (small.length > 0) {
      const cents = small.reduce((a, s) => a + s.cents, 0);
      big.push({
        name: "Autres",
        cents,
        share: cents / total,
        color: "var(--muted-foreground)",
      });
    }
    return big;
  }, [slices, total]);

  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    setAnimated(true);
  }, []);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (total === 0) {
    return <EmptyDonut />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto h-[200px] w-full">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Tooltip content={<DonutTooltip currency={currency} />} cursor={false} />
            <Pie
              data={donutData}
              dataKey="cents"
              nameKey="name"
              innerRadius="60%"
              outerRadius="85%"
              isAnimationActive={!reduceMotion && !animated}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {donutData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-base font-semibold tabular-nums">
            {formatCurrency(total, currency)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Dépensé
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-1 text-xs">
        {slices.map((s) => {
          const share = total > 0 ? s.cents / total : 0;
          return (
            <li
              key={s.key}
              className={`flex items-center justify-between ${
                s.cents === 0 ? "text-muted-foreground/60" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </span>
              <span className="tabular-nums">
                {formatCurrency(s.cents, currency)}
                <span className="ms-2 text-muted-foreground">
                  {formatPercent(share)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <CostDataTable slices={slices} currency={currency} total={total} />
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
  currency,
}: TooltipProps & { currency: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="tabular-nums">{formatCurrency(item.cents, currency)}</p>
      <p className="text-muted-foreground">{formatPercent(item.share)}</p>
    </div>
  );
}

function EmptyDonut() {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center">
      <div className="relative size-28">
        <div className="absolute inset-0 rounded-full bg-muted" />
        <div className="absolute inset-[22%] rounded-full bg-card" />
      </div>
      <p className="text-xs text-muted-foreground">
        Aucune dépense enregistrée pour ce mois.
      </p>
    </div>
  );
}

function CostDataTable({
  slices,
  currency,
  total,
}: {
  slices: Slice[];
  currency: string;
  total: number;
}) {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer">Afficher les données</summary>
      <table className="mt-2 w-full">
        <thead>
          <tr>
            <th className="py-1 text-start font-medium">Catégorie</th>
            <th className="py-1 text-end font-medium">Montant</th>
            <th className="py-1 text-end font-medium">Part</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((s) => (
            <tr key={s.key}>
              <td className="py-1">{s.name}</td>
              <td className="py-1 text-end tabular-nums">
                {formatCurrency(s.cents, currency)}
              </td>
              <td className="py-1 text-end tabular-nums">
                {total > 0 ? formatPercent(s.cents / total) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
