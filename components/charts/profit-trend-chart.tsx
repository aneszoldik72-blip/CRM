"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useWatch, type Control } from "react-hook-form";

import { bcp47, type AppLocale } from "@/i18n/routing";
import type { Rates } from "@/lib/currency";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { computeNetProfitCentsForEntry } from "@/lib/metrics";
import type { EntryValues } from "@/lib/validators/entry";

export type TrendPoint = {
  id: string;
  label: string;
  startDate: string; // YYYY-MM-DD
  profitCents: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: {
    payload: TrendPoint & { isCurrent?: boolean; delta?: number | null };
  }[];
};

function shortMonth(startDate: string, locale: string): string {
  const d = new Date(`${startDate}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
    numberingSystem: "latn",
  }).format(d);
}

export default function ProfitTrendChart({
  control,
  currency,
  serverTrend,
  currentMonthId,
  rates,
}: {
  control: Control<EntryValues>;
  currency: string;
  serverTrend: TrendPoint[];
  currentMonthId: string;
  rates: Rates;
}) {
  const t = useTranslations("charts.trend");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);

  const values = useWatch({ control }) as EntryValues;
  const liveCurrentProfit = computeNetProfitCentsForEntry(
    {
      delivered: values.delivered ?? 0,
      revenue_cents: values.revenue_cents ?? 0,
      ads_spend_cents: values.ads_spend_cents ?? 0,
      test_spend_cents: values.test_spend_cents ?? 0,
      ad_account_cents: values.ad_account_cents ?? 0,
      product_cost_cents: values.product_cost_cents ?? 0,
      service_cost_cents: values.service_cost_cents ?? 0,
      bonus_cents: values.bonus_cents ?? 0,
      sales_currency: values.sales_currency ?? currency,
      costs_currency: values.costs_currency ?? currency,
    },
    { baseCurrency: currency, rates },
  );

  const data = useMemo(() => {
    return serverTrend.map((d, i) => {
      const profitCents =
        d.id === currentMonthId ? liveCurrentProfit : d.profitCents;
      const prev = i > 0 ? serverTrend[i - 1]!.profitCents : null;
      const delta = prev !== null ? profitCents - prev : null;
      return {
        ...d,
        profitCents,
        isCurrent: d.id === currentMonthId,
        delta,
        x: shortMonth(d.startDate, bcp),
      };
    });
  }, [serverTrend, liveCurrentProfit, currentMonthId, bcp]);

  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    setAnimated(true);
  }, []);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const hasNegative = data.some((d) => d.profitCents < 0);

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <XAxis
            dataKey="x"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCurrencyShort(v, currency, bcp)}
            width={56}
          />
          {hasNegative && (
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
          )}
          <Tooltip
            content={
              <TrendTooltip currency={currency} locale={bcp} vsPrev={t("vsPrev")} />
            }
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          />
          <Bar
            dataKey="profitCents"
            radius={[4, 4, 0, 0]}
            isAnimationActive={!reduceMotion && !animated}
          >
            {data.map((d) => (
              <Cell
                key={d.id}
                fill={
                  d.profitCents >= 0
                    ? "var(--chart-positive)"
                    : "var(--destructive)"
                }
                fillOpacity={d.isCurrent ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {data.length === 1 && (
        <p className="text-center text-xs text-muted-foreground">
          {t("needSecondMonth")}
        </p>
      )}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">{tCommon("showData")}</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr>
              <th className="py-1 text-start font-medium">{t("monthCol")}</th>
              <th className="py-1 text-end font-medium">{t("netProfitCol")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id}>
                <td className="py-1">
                  {d.label}
                  {d.isCurrent && (
                    <span className="ms-1 text-primary">{t("current")}</span>
                  )}
                </td>
                <td className="py-1 text-end tabular-nums">
                  {formatCurrency(d.profitCents, currency, bcp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function TrendTooltip({
  active,
  payload,
  currency,
  locale,
  vsPrev,
}: TooltipProps & { currency: string; locale: string; vsPrev: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{item.label}</p>
      <p className="tabular-nums">
        {formatCurrency(item.profitCents, currency, locale)}
      </p>
      {item.delta !== null && item.delta !== undefined && (
        <p
          className={
            item.delta > 0
              ? "text-emerald-500"
              : item.delta < 0
                ? "text-destructive"
                : "text-muted-foreground"
          }
        >
          {item.delta > 0 ? "▲ +" : item.delta < 0 ? "▼ " : ""}
          {formatCurrency(Math.abs(item.delta), currency, locale)} {vsPrev}
        </p>
      )}
    </div>
  );
}
