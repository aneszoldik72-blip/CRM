"use client";

import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";

import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/format";
import type { EntryValues } from "@/lib/validators/entry";

type Stage = {
  name: string;
  value: number;
  percentOfLeads: number | null;
  dropFromPrev: number | null;
};

function buildStages(leads: number, orders: number, delivered: number): Stage[] {
  return [
    {
      name: "Leads",
      value: leads,
      percentOfLeads: leads > 0 ? 1 : null,
      dropFromPrev: null,
    },
    {
      name: "Commandes",
      value: orders,
      percentOfLeads: leads > 0 ? orders / leads : null,
      dropFromPrev: leads > 0 ? 1 - orders / leads : null,
    },
    {
      name: "Livrées",
      value: delivered,
      percentOfLeads: leads > 0 ? delivered / leads : null,
      dropFromPrev: orders > 0 ? 1 - delivered / orders : null,
    },
  ];
}

export default function FunnelChart({
  control,
}: {
  control: Control<EntryValues>;
}) {
  const values = useWatch({ control }) as EntryValues;
  const leads = values.leads ?? 0;
  const orders = values.orders ?? 0;
  const delivered = values.delivered ?? 0;

  const stages = useMemo(
    () => buildStages(leads, orders, delivered),
    [leads, orders, delivered],
  );
  const maxValue = Math.max(leads, orders, delivered, 1);

  if (leads === 0 && orders === 0 && delivered === 0) {
    return <EmptyFunnel />;
  }

  // Single-color rectangles with decreasing opacity per stage — same visual
  // hierarchy as the previous trapezoid funnel, no sloped sides.
  const opacities = [1, 0.7, 0.4] as const;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2.5">
        {stages.map((s, i) => {
          const widthPct =
            s.value > 0 ? Math.max((s.value / maxValue) * 100, 6) : 0;
          return (
            <li key={s.name} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatNumber(s.value)}
                </span>
              </div>
              <div className="h-7 w-full rounded-md bg-muted/40">
                <div
                  className={cn("h-full rounded-md transition-[width]")}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: "var(--chart-1)",
                    opacity: opacities[i],
                  }}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>

      <FunnelDataTable stages={stages} />
    </div>
  );
}

function EmptyFunnel() {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex w-full max-w-xs flex-col items-stretch gap-2">
        <div className="h-7 w-full rounded-md bg-muted" />
        <div className="h-7 w-3/4 rounded-md bg-muted" />
        <div className="h-7 w-1/2 rounded-md bg-muted" />
      </div>
      <p className="text-xs text-muted-foreground">
        Saisis tes leads, commandes et livraisons pour voir le tunnel.
      </p>
    </div>
  );
}

function FunnelDataTable({ stages }: { stages: Stage[] }) {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer">Afficher les données</summary>
      <table className="mt-2 w-full text-start">
        <thead>
          <tr className="text-start">
            <th className="py-1 text-start font-medium">Étape</th>
            <th className="py-1 text-end font-medium">Valeur</th>
            <th className="py-1 text-end font-medium">% des leads</th>
            <th className="py-1 text-end font-medium">
              Perte vs précédente
            </th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s) => (
            <tr key={s.name}>
              <td className="py-1">{s.name}</td>
              <td className="py-1 text-end tabular-nums">
                {formatNumber(s.value)}
              </td>
              <td className="py-1 text-end tabular-nums">
                {s.percentOfLeads === null
                  ? "—"
                  : formatPercent(s.percentOfLeads)}
              </td>
              <td className="py-1 text-end tabular-nums">
                {s.dropFromPrev === null
                  ? "—"
                  : s.dropFromPrev === 0
                    ? formatPercent(0)
                    : `−${formatPercent(s.dropFromPrev)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
