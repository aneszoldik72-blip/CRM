"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import type { Control } from "react-hook-form";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import type { TrendPoint } from "@/components/charts/profit-trend-chart";
import type { EntryValues } from "@/lib/validators/entry";

const FunnelChart = dynamic(
  () => import("@/components/charts/funnel-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="funnel" />,
  },
);

const CostBreakdownChart = dynamic(
  () => import("@/components/charts/cost-breakdown-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="donut" />,
  },
);

const ProfitTrendChart = dynamic(
  () => import("@/components/charts/profit-trend-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="trend" />,
  },
);

type TabKey = "funnel" | "costs" | "trend";

export function ChartsTabs({
  control,
  currency,
  serverTrend,
  currentMonthId,
}: {
  control: Control<EntryValues>;
  currency: string;
  serverTrend: TrendPoint[];
  currentMonthId: string;
}) {
  const t = useTranslations("charts");
  const [active, setActive] = useState<TabKey>("funnel");
  const [activated, setActivated] = useState<Set<TabKey>>(
    new Set<TabKey>(["funnel"]),
  );

  function handleChange(value: string) {
    const next = value as TabKey;
    setActive(next);
    setActivated((prev) => {
      if (prev.has(next)) return prev;
      const copy = new Set(prev);
      copy.add(next);
      return copy;
    });
  }

  return (
    <section
      aria-label={t("section")}
      className="rounded-xl border border-border bg-card p-4"
    >
      <Tabs value={active} onValueChange={handleChange}>
        <TabsList className="w-full">
          <TabsTrigger value="funnel">{t("tabs.funnel")}</TabsTrigger>
          <TabsTrigger value="costs">{t("tabs.costs")}</TabsTrigger>
          <TabsTrigger value="trend">{t("tabs.trend")}</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="pt-3">
          {activated.has("funnel") ? (
            <FunnelChart control={control} />
          ) : (
            <ChartSkeleton variant="funnel" />
          )}
        </TabsContent>

        <TabsContent value="costs" className="pt-3">
          {activated.has("costs") ? (
            <CostBreakdownChart control={control} currency={currency} />
          ) : (
            <ChartSkeleton variant="donut" />
          )}
        </TabsContent>

        <TabsContent value="trend" className="pt-3">
          {activated.has("trend") ? (
            <ProfitTrendChart
              control={control}
              currency={currency}
              serverTrend={serverTrend}
              currentMonthId={currentMonthId}
            />
          ) : (
            <ChartSkeleton variant="trend" />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
